const express = require('express');
const router = express.Router();
const pathUtil = require('path');
const fs = require('fs');
const async = require('async');
const Post = require('../model/posts.js');
const Notification = require('../model/notifications.js');
const s3upload = require('./s3upload.js');
const fcmPush = require('./push.js');
// 동네소식 목록, 정보글 쓰기, 수정, 삭제
router.route('/info')
    .get(infoList)
    .post(writeInfo)
    .put(modifyInfo)
    .delete(deleteInfo);

// 정보글 상세페이지 => 보류
router.route('/info/detail')
    .get(infoDetail);

// 정보글 좋아요
router.put('/info/like', likeInfo);

function infoList(req, res, next){
    console.log('get (get) request of /info');
    var postAddress = req.query;
    const category = parseInt(postAddress.category);
    const endPost = postAddress.endPost;
    const postCount = parseInt(postAddress.postCount);
    const userId = req.query.userId;
    delete postAddress.category;
    delete postAddress.endPost;
    delete postAddress.userId;
    delete postAddress.postCount;

    const callback = function(err, results){
        if (err){
            return next(err);
        }
        console.log('Got information of near by posts')
        const myAddress = results.userAddress || null;
        delete results.userAddress;
        var data = {
            msg : 'success',
            myAddress : myAddress,
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
    }
    if (Object.keys(postAddress).length == 0){
        console.log('No postAddress querystring');
        Post.getInfoPostsNearby(endPost, userId, category, postCount, callback);
    }
    else{
        Post.getInfoPostsByAddress(endPost, postAddress, category, postCount, callback);
    }
}

function writeInfo(req, res, next){
    console.log('get (post) request of /info');
    var dueDate = new Date();
    dueDate.setDate(dueDate.getDate()+parseInt(req.body.due));
    const userId = req.query.userId;
    const body = req.body;
    const postAddress = {
        area1 : body.area1,
        area2 : body.area2,
        area3 : body.area3,
        area4 : body.area4,
        area5 : body.area5
    };
    var post = {
        userId : userId,
        category : parseInt(body.category),
        due : dueDate,
        postContent : body.postContent,
        postAddress : postAddress
    };
    const postImg = body.postImg;
    s3upload.original(postImg.path, postImg.type, 'postImg', userId, (err, imageUrl)=>{
        if(err){
            fs.unlink(postImg.path, (err)=>{
                if (err){
                    console.log('fail to delete the empty image >>>', postImg.path);
                }
                else{
                    console.log('Deleted a empty image');
                }
                return next(err);
            });
        }
        console.log('s3 uploaded the original image');
        post.postImg = imageUrl;
        s3upload.thumbnail(postImg.path, postImg.type, 'postThumbnail', userId, (err, imageUrl)=>{
            const thumbnailPath = __dirname+'/../upload/thumb_'+pathUtil.basename(postImg.path);
            if(err){
                return next(err);
            }
            console.log('s3 uploaded the thumbnail image');
            post.postThumbnail = imageUrl;
            post.postLikeUsers = [];
            post.reply =[];
            Post.recordPost(post, (err, recordedPost)=>{
                if (err){
                    return next(err);
                }
                console.log('The info post recorded in the db');
                const data = {
                    msg : 'success',
                    data : recordedPost
                }
                res.json(data);
                fs.unlink(postImg.path, (err)=>{
                    if (err){
                        console.log('Fail to delete a temporary file >>>', postImg.path)
                    }
                    else{
                        console.log('Removed the temporary image of the post');
                    }
                    fs.unlink(thumbnailPath, (err)=>{
                        if (err){
                            console.log('Fail to delete a temporary thumbnail file >>>', thumbnailPath);
                        }
                        else{
                            console.log('Removed the temporary thumbnail image of the post')
                        }
                    });
                });
                const pushData = {
                    pushType : 1,
                    postId : recordedPost._id,
                    category : recordedPost.category,
                    pusherId : recordedPost.userId,
                    pusherNickname : recordedPost.nickname,
                    img : recordedPost.postThumbnail,
                    content : recordedPost.postContent
                }
                Notification.addPushs(pushData, postAddress, (err, tokens)=>{
                    if (err){
                        return console.log('FAIL TO SAVE A PUSH DATA >>>', pushData);
                    }
                    fcmPush(tokens, pushData, (err, response)=>{
                        if (err){
                            console.log('FAIL TO PUSH OF %s >>>', recordedPost._id);
                        }
                        console.log('PUSH COMPLETE >>>', response);
                    });
                });
            });
        });
    });

}

function infoDetail(req, res, next){
    const postId = req.query.postId;
    Post.getDetail(postId, (err, results)=>{
        if (err){
            return next(err);
        }
        const data = {
            msg : 'success',
            data : results
        }
        res.json(data);
    });

}

function modifyInfo(req, res, next){
    var dueDate = new Date();
    const userId = req.query.userId;
    const postId = req.body.postId;
    const category = parseInt(req.body.category);
    const address = {
        area1 : req.body.area1,
        area2 : req.body.area2,
        area3 : req.body.area3,
        area4 : req.body.area4,
        area5 : req.body.area5
    }
    const due = req.body.due;
    const postContent = req.body.postContent;
    const postImg = req.body.postImg;
    if (!category && !address.area1 && !address.area2 && !address.area3 && !address.area4 && !address.area5 && !due && !postContent && !postImg || postImg.size == 0){
        Post.getPostDetail(postId, (err, result)=>{
            if (err){
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
    var imageUrls;
    async.parallel([
        function(callback){
            Post.getImageUrl('postImg postThumbnail', postId, (err, prevImageUrls)=>{
                if (err){
                    console.log('THERE IS NO POSTIMG IN THE POST OF >>>', postId);
                } else {
                    imageUrls = prevImageUrls;
                }
                callback();
            });
        },
        function(callback){
            if (category){
                query.category = category;
                callback();
            } else {
                callback();
            }
        },
        function(callback){
            if (address.area1 || address.area2 || address.area3 || address.area4 || address.area5){
                query.postAddress = address;
                callback();
            } else {
                callback();
            }
        },
        function(callback){
            if (due){
                dueDate.setFullYear(parseInt(due.substring(0,4)));
                dueDate.setMonth(parseInt(due.substring(4,6))-1);
                dueDate.setDate(parseInt(due.substring(6,8)));
                dueDate.setHours(parseInt(due.substring(8,10)));
                dueDate.setMinutes(parseInt(due.substring(10,12)));
                query.due = dueDate;
                callback();
            } else {
                callback();
            }
        },
        function(callback){
            if (postContent){
                query.postContent = postContent;
                callback();
            } else {
                callback();
            }
        },
        function(callback){
            if (postImg && postImg.size > 0){
                async.parallel([
                    function(cb){
                        s3upload.original(postImg.path, postImg.type, 'postImg', userId, cb);
                    },
                    function(cb){
                        s3upload.thumbnail(postImg.path, postImg.type, 'postThumbnail', userId, cb);
                    }
                ], (err, imageUrls)=>{
                    if (err){
                        //s3삭제
                        return callback(err);
                    }
                    query.postImg = imageUrls[0];
                    query.postThumbnail = imageUrls[1];
                    callback();
                    fs.stat(postImg.path, (err, stats)=>{
                        if (err){
                            console.log('THERE IS NO THE IMAGE IN UPLOAD FILE >>>', postImg.path);
                        } else {
                            fs.unlink(postImg.path, (err)=>{
                                if (err){
                                    console.log('FAIL TO DELETE THE IMAGE IN UPLOAD FILE >>>', postImg.path);
                                }
                            });
                        }
                    });
                    thumbnailPath = __dirname + '/../upload/thumb_'+pathUtil.basename(postImg.path);
                    fs.stat(thumbnailPath, (err, stats)=>{
                        if (err){
                            console.log('THERE IS NO THE IMAGE IN UPLOAD FILE >>>', thumbnailPath);
                        } else {
                            fs.unlink(thumbnailPath, (err)=>{
                                if (err){
                                    console.log('FAIL TO DELETE THE IMAGE IN UPLOAD FILE >>>', thumbnailPath);
                                }
                            });
                        }
                    });
                });
            } else {
                callback();
            }
        }
    ], (err)=>{
        if (err){
            return next(err);
        }
        Post.updatePost(userId, postId, query, (err, updatedPost)=>{
            if (err){
                next(err);
                s3upload.delete(query.postImg, (err,result)=>{
                    if (err){
                        console.log('FAIL TO DELETE THE IMAGE IN S3 >>>', query.postImg);
                    }
                });
                s3upload.delete(query.postThumbnail, (err, result)=>{
                    if (err){
                        console.log('FAIL TO DELETE THE IMAGE IN S3 >>>', query.postThumbnail);
                    }
                });
            }
            const data = {
                msg : 'success',
                data : updatedPost
            }
            res.json(data);
            s3upload.delete(imageUrls.postImg, (err, result)=>{
                if (err){
                    console.log('FAIL TO DELETE THE IMAGE IN S3 >>>', imageUrls.postImg);
                }
            });
            s3upload.delete(imageUrls.postThumbnail, (err, result)=>{
                if (err){
                    console.log('FAIL TO DELETE THE IMAGE IN S3 >>>', imageUrls.postThumbnail);
                }
            });
        });
    });
}

function deleteInfo(req, res, next){
    const userId = req.query.userId;
    const postId = req.body.postId;
    Post.removePost(userId, postId, (err, removedPost)=>{
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
                console.log('FAIL TO DELETE THE IMAGE IN S3 >>>', removedPost.postImg);
            }
        });
        s3upload.delete(removedPost.postThumbnail, (err, result)=>{
            if (err){
                console.log('FAIL TO DELETE THE IMAGE IN S3 >>>', removedPost.postThumbnail);
            }
        });
    });
}

function likeInfo(req, res, next){
    const userId = req.query.userId;
    const postId = req.body.postId;
    var query;
    Post.checkPostLiked(userId, postId, (err, liked)=>{
        if ( err ){
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
                return next(err);
            }
            const data = {
                msg : 'success',
                postId : updatedPost._id
            }
            res.json(data);
            const pushData = {
                pushType : 1,
                postId : postId,
                category : 1, //좋아요
                pusherId : updatedPost.userId,
                pusherNickname : updatedPost.nickname,
                img : updatedPost.profileThumbnail,
                content : null
            }
            if (!liked){
                Notification.addPush(pushData, (err, token)=>{
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