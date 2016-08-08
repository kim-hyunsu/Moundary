const express = require('express');
const router = express.Router();
const Post = require('../model/posts.js');
const s3upload = require('./s3upload.js');
const pathUtil = require('path');
const fs = require('fs');

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
    var postAddress = req.query;
    const category = postAddress.category;
    const endPost = postAddress.endPost;
    const userId = req.query.userId;
    delete postAddress.category;
    delete postAddress.endPost;
    delete postAddress.userId;

    if (Object.keys(postAddress).length == 0){
        Post.getInfoPostsNearby(endPost, userId, category, 60, (err, results)=>{
            if (err){
                return next(err);
            }
            const myAddress = results.userAddress;
            delete results.userAddress;
            const data = {
                msg : 'success',
                myAddress : myAddress,
                page : {
                    postCount : results.length,
                    endPost : results[0]._id
                },
                data : results
            }
            res.json(data);
        });
    }
    else{
        Post.getInfoPostsByAddress(endPost, postAddress, category, 60, (err, results)=>{
            if (err){
                return next(err);
            }
            const data = {
                msg : 'success',
                page : {
                    postCount : results.length,
                    endPost : results[0]._id
                },
                data : results
            }
            res.json(data);
        });
    }
}

function writeInfo(req, res, next){
    console.log('get (post) request of /info');
    const now = new Date();
    var dueDate = new Date();
    dueDate.setDate(dueDate.getDate()+req.body.due);
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
        category : body.category,
        due : dueDate,
        postContent : body.postContent,
        postAddress : postAddress
    };
    const postImg = body.postImg;
    s3upload.original(postImg.path, postImg.type, 'postImg', now, userId, (err, imageUrl)=>{
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
        s3upload.thumbnail(postImg.path, postImg.type, 'postThumbnail', now, userId, (err, imageUrl)=>{
            const thumbnailPath = __dirname+'/../upload/' + 'thumbnail_'+pathUtil.basename(postImg.path);
            if(err){
                return next(err);
            }
            console.log('s3 uploaded the thumbnail image');
            post.postThumbnail = imageUrl;
            post.userId = post.userId;
            post.postDate = now;
            post.postLikeUsers = [];
            post.replyCount = 0;
            post.reply =[];
            Post.recordPost(post, (err, postId)=>{
                if (err){
                    return next(err);
                }
                console.log('The info post recorded in the db');
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
                        const data = {
                            msg : 'success',
                            postId : postId
                        }
                        res.json(data);
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
            postInfo : results
        }
        res.json(data);
    });

}

function modifyInfo(req, res, next){

}

function deleteInfo(req, res, next){

}

function likeInfo(req, res, next){
    
}

module.exports = router;