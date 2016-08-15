const express = require('express');
const router = express.Router();
const fs = require('fs');
const async = require('async');
const Post = require('../model/posts.js');
const s3upload = require('./s3upload.js');

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

    Post.getPosts(endPost, userId, postCount, (err, results)=>{
        if(err){
            return next(err);
        }
        const hasFriend = results.hasFriend;
        delete results.hasFriend;
        async.each(results, (ele, cb)=>{
            const mongoose = require('mongoose');
            console.log('BEFORE>>>', ele.myLike);
            console.log('USERID', userId, typeof userId);
            console.log('OBJECT USERID', mongoose.Types.ObjectId(userId), typeof mongoose.Types.ObjectId(userId));
            console.log('POST LIKE USERS', ele.postLikeUsers[0], typeof ele.postLikeUsers[0]);
            console.log('CHECK EQUALITY', mongoose.Types.ObjectId(userId)==ele.postLikeUsers[0]);
            if (ele.postLikeUsers.indexOf(userId) == -1){
                ele.myLike = false;
            }
            else {
                ele.myLike = true;
            }
            // delete ele.postLikeUsers;
            console.log('AFTER>>>', ele.myLike);
            cb();
        }, (err)=>{
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
    });
}


function myPostList(req, res, next){
    console.log('get (get) request of /post/mine');
    const endPost = req.query.endPost;
    const userId = req.query.userId;
    const postCount = parseInt(req.query.postCount);

    Post.getMyPosts(endPost, userId, postCount, (err, results)=>{
        if (err){
            return next(err);
        }
        async.each(results, (ele, cb)=>{
            if (ele.postLikeUsers.indexOf(userId) == -1){
                ele.myLike = false;
            }
            else {
                ele.myLike = true;
            }
            // delete ele.postLikeUsers;
            cb();
        }, (err)=>{
            if (err){
                return next(err);
            }
            var data = {
                msg : 'success',
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
    s3upload.original(postImg.path, postImg.type, 'postImg', userId, (err, imageUrl)=>{
        if (err){
            fs.unlink(postImg.path, (err)=>{
                if (err){
                    console.log('fail to delete the empty image');
                }
                else{
                    console.log('Deleted a empty image');
                }
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

// function postDetail(req, res, next){
//     console.log('get (get) request of /post/detail');
//     const postId = req.query.postId;
//     Post.getPostDetail(postId, (err, results)=>{
//         if (err){
//             return next(err);
//         }
//         const data = {
//             msg : 'success',
//             data : results
//         }
//         res.json(data);
//     });
// }

function modifyPost(req, res, next){
    const userId = req.query.userId;
    const postId = req.body.postId;
    const postContent = req.body.postContent;
    const postImg = req.body.postImg;
    if (postContent || postImg){
        var query = {};
        async.parallel([
            function(cb){
                if (postContent){
                    query.postContent = postContent;
                    cb();
                } else {
                    cb();
                }
            },
            function(cb){
                if (postImg){
                    s3upload.original(postImg.path, postImg.type, 'postImg', userId, (err, imageUrl)=>{
                        if (err){
                            return cb(err);
                        }
                        query.postImg = imageUrl;
                        cb();
                    });
                } else {
                    cb();
                }
            }
        ], (err)=>{
            if (err){
                return next(err);
            }
            Post.updatePost(userId, postId, query, (err, updatedPost)=>{
                if (err){
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
            });
        });

    } else {
        Post.getPostDetail(postId, (err, result)=>{
            if (err){
                return next(err);
            }
            const data = {
                msg : 'success',
                data : result
            }
            res.json(data);
        });
    }
}

function deletePost(req, res, next){
    const userId = req.query.userId;
    const postId = req.body.postId;
    Post.remove(userId, postId, (err, removedPost)=>{
        if (err){
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
    Post.checkLiked(userId, postId, (err, liked)=>{
        if ( err ){
            return next(err);
        }
        if (!liked){
            // 아직 좋아요 안 한 경우
            const query = {$push : {postLikeUsers : userId}}; // db에 likeCount 넣을지 말지 정하기(만약 db쿼리에서 바로 결과 mylike를 기록할 수 있다면 likeCount를 넣고 불가능하다면 그냥 도출된 postLikeUsers에서 length계산       
        } else {
            // 이미 좋아요 한 경우
            const query = {$pull : {postLikeUsers : userId}};
        }
        Post.updatePost(userId, postId, query, (err, updatedPost)=>{
            if (err){
                return next(err);
            }
            const data = {
                msg : 'success',
                postId : updatedPost._id
            }
            res.json(data);
        }); 
    });
}

module.exports = router;