const express = require('express');
const router = express.Router();
const fs = require('fs');
const async = require('async');
const Post = require('../model/posts.js');
const s3upload = require('./s3upload.js');
const Notification  = require('../model/notifications.js');
const fcmPush = require('./push.js');
var err = new Error();

// 친구소식 목록, 글 쓰기, 수정, 삭제
router.route('/post')
    .get(newsList)
    .post(writePost)
    .put(modifyPost)
    .delete(deletePost)

// 글 상세페이지 => 보류
router.route('/post/detail')
    .get(postDetail)

// 내 이야기 목록
router.get('/post/mine', myPostList);

// 글 좋아요
router.put('/post/like', likePost);

// newsfeed posts
function newsList(req, res, next){
    console.log('get (get) request of /post');
    const endPost = req.query.endPost;
    const userId = req.query.userId;
    const postCount = parseInt(req.query.postCount);
    if (!userId){
        err.code = 401;
        return next(err);
    }
    Post.getPosts(endPost, userId, postCount, (err, results)=>{
        if(err){
            err.code = 404;
            return next(err);
        }
        const hasFriend = results.hasFriend;
        delete results.hasFriend;
        var data = {
            msg : 'success',
            hasFriend : hasFriend,
            page : {
                postCount : results.length
            },
            data : results
        }
        if (results.length ==0 ){
            data.page.endPost = null;
        }
        else{
            data.page.endPost = results[results.length-1]._id
        }
        res.json(data);
    });
}


function myPostList(req, res, next){
    console.log('get (get) request of /post/mine');
    const endPost = req.query.endPost;
    const userId = req.query.userId;
    const postCount = parseInt(req.query.postCount);
    if(!userId){
        err.code = 401;
        return next(err);
    }
    Post.getMyPosts(endPost, userId, postCount, (err, results)=>{
        if (err){
            err.code = 404;
            return next(err);
        }
        var data = {
            msg : 'success',
            page : {
                postCount : results.length
            },
            data : results
        }
        if (results.length == 0 ){
            data.page.endPost = null;
        }
        else{
            data.page.endPost = results[results.length-1]._id
        }
        res.json(data);
    });
}

function writePost(req, res, next){
    console.log('get (post) request of /post');
    // bring the userId from the session
    const userId = req.query.userId;
    console.log('parsed the multipart request');
    const postContent = req.body.postContent;
    var postImg = req.body.postImg;
    // upload the original image to s3
    console.log('POSTiMG',postImg);
    if(!userId || !postImg){
        if (postImg){
            fs.stat(postImg.path, (err, stats)=>{
                if (!err){
                    fs.unlink(postImg.path, (err)=>{
                        if (err){
                            console.log('FAIL TO DELETE THE IMAGE IN UPLOAD FILE >>>', postImg.path);
                        }
                    });
                }
            });
        }
        if (!userId){
            err.code = 401;
            return next(err);
        }
        err.code = 400;
        return next(err);
    }
    s3upload.original(postImg.path, postImg.type, 'postImg', userId, (err, imageUrl)=>{
        if (err){
            fs.unlink(postImg.path, (err)=>{
                if (err){
                    console.log('fail to delete the empty image');
                }
                else{
                    console.log('Deleted a empty image');
                }
                err.code = 500;
                return next(err);   
            });
        }
        console.log('Uploaded the post image');
        // post infomations
        var diary = {
            category : 0, //diary
            userId : userId,
            postImg : imageUrl,
            postContent : postContent,
            postLikeUsers : [],
            reply : [] 
        }
        // create a document of the post on the post collection of the db, 'moundary'
        Post.recordPost(diary, (err, recordedPost)=>{
            if (err){
                fs.unlink(postImg.path, (err)=>{
                    if (err){
                        console.log('fail to delete the empty image');
                    }
                    else{
                        console.log('Deleted a empty image');
                    }
                    err.code = 500;
                    return next(err);   
                });
            }
            console.log('Recorded the post on the db');
            const data = {
                msg: 'success',
                data : recordedPost
            }
            console.log('Final data >>>', data);
            res.json(data);
            console.log('RESPONSE COMPLETE');
            // delete the temporary file in upload folder
            fs.unlink(postImg.path, (err)=>{
                if (err){
                    console.log('Fail to delete a temporary file >>>', postImg.path);
                }
                else{
                    console.log('Removed the temporary image of the post');
                }
            });
        });
    });
}

function postDetail(req, res, next){
    console.log('get (get) request of /post/detail');
    const userId = req.query.userId;
    const postId = req.query.postId;
    if (!userId){
        err.code = 401;
        return next(err);
    }
    if (!postId){
        err.code = 400;
        return next(err);
    }
    Post.getPostDetail(userId, postId, (err, results)=>{
        if (err){
            err.code = 404;
            return next(err);
        }
        const data = {
            msg : 'success',
            data : results
        }
        res.json(data);
        Notification.confirmAlteration(userId, postId, (err)=>{
            if (err){
                console.log('FAIL TO CONFIRM A NOTIFICATION OF USERID >>>', userId);
            }
        });
    });
}

function modifyPost(req, res, next){
    const userId = req.query.userId;
    const postId = req.body.postId;
    const postContent = req.body.postContent;
    const postImg = req.body.postImg;
    if (!userId){
        err.code = 401;
        return next(err);
    }
    if (!postId){
        err.code = 400;
        return next(err);
    }
    if (!postContent && !postImg || postImg.size == 0){
        Post.getPostDetail(postId, (err, result)=>{
            if (err){
                err.code = 404;
                return next(err);
            }
            const data = {
                msg : 'success',
                data : result
            }
            return res.json(data);
        });
    }
    var query = {};
    var imageUrl;
    async.parallel([
        function(cb){
            Post.getImageUrl('postImg', postId, (err, prevImageUrls)=>{
                if (err){
                    console.log('THERE IS NO POSTIMG IN THE POST OF >>>', postId);
                } else {
                    imageUrl = prevImageUrls;
                }
                cb();
            });
        },
        function(cb){
            if (postContent){
                query.postContent = postContent;
                cb();
            } else {
                cb();
            }
        },
        function(cb){
            if (postImg || postImg.size > 0){
                s3upload.original(postImg.path, postImg.type, 'postImg', userId, (err, url)=>{
                    if (err){
                        return cb(err);
                    }
                    query.postImg = url;
                    cb();
                    fs.stat(postImg.path, (err, stats)=>{
                        if (err){
                            console.log('THERE IS NO IMAGE TO DELETE>>>', postImg.path);
                        } else {
                            fs.unlink(postImg.path, (err)=>{
                                if (err){
                                    console.log('FAIL TO DELETE THE IMAGE IN UPLOAD FIEL >>>', postImg.path);
                                }
                            });
                        }
                    });
                });
            } else {
                cb();
            }
        }
    ], (err)=>{
        if (err){
            err.code = 500;
            return next(err);
        }
        Post.updatePost(userId, postId, query, (err, updatedPost)=>{
            if (err){
                err.code = 500;
                next(err);
                s3upload.delete(query.postImg, (err, result)=>{
                    if (err){
                        console.log('FAIL TO DELETE THE POSTIMG IN S3 >>>', query.postImg);
                    }
                });
                return;
            }
            const data = {
                msg : 'success',
                data : updatedPost
            }
            res.json(data);
            s3upload.delete(imageUrl.postImg, (err, result)=>{
                if (err){
                    console.log('FAIL TO DELETE THE IMAGE IN S3 >>>', imageUrl.postImg)
                }
            });
        });
    });
}

function deletePost(req, res, next){
    const userId = req.query.userId;
    const postId = req.body.postId;
    if (!userId){
        err.code = 401;
        return next(err);
    }
    if (!postId){
        err.code = 400;
        return next(err);
    }
    Post.removePost(userId, postId, (err, removedPost)=>{
        if (err){
            err.code = 500;
            return next(err);
        }
        const data = {
            msg : 'success',
            postId : removedPost._id
        }
        res.json(data);
        s3upload.delete(removedPost.postImg, (err, result)=>{
            if (err){
                console.log('FAIL TO REMOVE THE IMAGE IN S3 >>>', removedPost.postImg);
            }
        });
    });
}

// 좋아요 한 번밖에 못 누르게 하기(게시물 당)
function likePost(req, res, next){
    const userId = req.query.userId;
    const postId = req.body.postId;
    if (!userId){
        err.code = 401;
        return next(err);
    }
    if (!postId){
        err.code = 400;
        return next(err);
    }
    var query;
    Post.checkPostLiked(userId, postId, (err, liked)=>{
        if ( err ){
            err.code = 500;
            return next(err);
        }
        if (!liked){
            // 아직 좋아요 안 한 경우
            query = {$push : {postLikeUsers : userId}, $inc : {postLikeCount : 1}};
        } else {
            // 이미 좋아요 한 경우
            query = {$pull : {postLikeUsers : userId}, $inc : {postLikeCount : -1}};
        }
        Post.likePost(postId, query, (err, updatedPost)=>{
            if (err){
                err.code = 500;
                return next(err);
            }
            const data = {
                msg : 'success',
                postId : updatedPost._id
            }
            res.json(data);
            if (!liked){
                var pushData = {
                    pushType : 0,
                    postId : postId,
                    category : 1, //좋아요
                    pusherId : userId,
                    pullerId : updatedPost.userId,
                    content : null
                }
                Notification.addLikePush(pushData, (err, token)=>{
                    if (err){
                        return console.log('FAIL TO SAVE A PUSH OR GET A TOKEN OF >>>', userId);
                    }
                    fcmPush([token], pushData, (err, response)=>{
                        if (err){
                            console.log('FAIL TO PUSH A POST OF %s >>>', postId);
                        }
                        console.log('PUSH COMPLETE >>>', response);
                    });
                });
            }
        }); 
    });
}

module.exports = router;