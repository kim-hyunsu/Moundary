const express = require('express');
const router = express.Router();
const pathUtil = require('path');
const fs = require('fs');
const async = require('async');
const Post = require('../model/posts.js');
const s3upload = require('./s3upload.js');
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
router.put('/post/like', likeInfo);

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
        async.each(results, (ele, cb)=>{
            if (ele.postLikeUsers.indexOf(userId) == -1){
                ele.myLike = false;
            }
            else{
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
        });
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
                    })
                })
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

}

function deleteInfo(req, res, next){
    const userId = req.query.userId;
    const postId = req.body.postId;
    Post.remove(userId, postId, (err, removedPost)=>{
        if (err){
            return next(err);
        }
        const data = {
            msg : 'success',
            postId : removedPost
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