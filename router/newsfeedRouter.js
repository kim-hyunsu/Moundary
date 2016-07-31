const express = require('express');
const router = express.Router();
const formidable = require('formidable');
var form = new formidable.IncomingForm();
const fs = require('fs');
const Post = require('../model/posts.js');
const User = require('../model/users.js');
const s3upload = require('./s3upload.js');

// 친구소식 목록, 글 쓰기
router.route('/post')
    .get(newsList)
    .post(writePost);

// 글 상세페이지, 글 수정, 글 삭제
router.route('/post/detail')
    .get(postDetail)
    .put(modifyInfo)
    .delete(deleteInfo);

// 글 좋아요
router.put('/post/like', likePost);

// 친구 유무 확인
router.get('/post/friend', checkFriend);

// 내 이야기 목록
router.get('/post/mine', myPostList);

function newsList(req, res, next){

    const endPost = req.query.endPost;
    const friend = req.query.friend;
    const userId = req.query.userId;

    var callback = function(err, results){
        var data;
        if(err){
            data = {
                msg: 'failure'
            }
            res.json(data);
            return next(err);
        }
        data = {
            msg : 'success',
            page : {
                postCount : results.length,
                endPost : results[0].postId
            },
            data : results
        }
        res.json(data);
    }
    if (friend){
        Post.getPosts(endPost, userId, 60, callback);
    }
    else{
        Post.getLocalPosts(endPost, userId, 60, callback);
    }
}

function writePost(req, res, next){
    const now = new Date();
    const userId = req.query.userId;
    
    form.encoding = 'utf-8';
    form.keepExtension = true;
    form.uploadDir = __dirname + '/upload';

    form.parse(req, (err, fields, files)=>{
        var data;
        if (err){
            data = {
                msg : 'failure'
            }
            res.json(data);
            return next(err);
        }
        const postContent = fields.postContent;
        var image = files.image;
        if (image && image.size > 0){
            s3upload.original(image.name, 'postImg', date, userId, (err, imageUrl)=>{
                if (err){
                    data = {
                        msg : 'fail to upload the image'
                    }
                    res.json(data);
                    return next(err);
                }
                const post ={
                    category : 0, //diary
                    userId : userId,
                    postImg : imageUrl,
                    postContent : postContent,
                    postDate : now,
                    postLikeUsers : [],
                    reply : [] 
                }
                Post.recordPost(post, (err, postId)=>{
                    if (err){
                        data = {
                            msg : 'fail to record on db'
                        }
                        res.json(data);
                        return next(err);
                    }
                    fs.unlink('./upload/'+image.name, (err)=>{
                        if (err){
                            data = {
                                msg : 'fail to delete the temporary file'
                            }
                            res.json(data);
                            next(err);
                        }
                        data = {
                            msg: 'success',
                            postId : postId
                        }
                        res.json(data);
                    });
                });
            });
        }
        else{
            data = {
                msg: 'No image input'
            }
            res.json(data);
            return next(new Error('No image input'));
        }
    });
}

function postDetail(req, res, next){

}

function modifyInfo(req, res, next){

}

function deleteInfo(req, res, next){

}

function likePost(req, res, next){

}

function checkFriend(req, res, next){
    Post.getFriendCount((err, results)=>{
        var data;
        if (err){
            data = {
                msg: 'failure'
            }
            res.json(data);
            return next(err);
        }
        data = {
            msg : 'success',
            friendCount : results.friendList.length
        }
        res.json(data);
    });

}

function myPostList(req, res, next){

}

module.exports = router;