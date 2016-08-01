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

// newsfeed posts
function newsList(req, res, next){
    console.log('get (get) request of /post/detail');
    const endPost = req.query.endPost;
    const friend = req.query.friend;
    const userId = req.query.userId;

    var callback = function(err, results){
        var data;
        if(err){
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
    // if this user has friends
    if (friend){
        console.log('This user has friends');
        Post.getPosts(endPost, userId, 60, callback);
    }
    else{
        console.log('This user has no friends');
        Post.getLocalPosts(endPost, userId, 60, callback);
    }
}

function writePost(req, res, next){
    console.log('get (post) request of /post');
    const now = new Date();
    // bring the userId from the session
    const userId = req.query.userId;
    
    form.encoding = 'utf-8';
    form.keepExtensions = true;  // save with extension
    form.uploadDir = __dirname + '/../upload'; // saved a temporary image file automatically in upload folder

    // multipart parsing
    form.parse(req, (err, fields, files)=>{
        var data;
        if (err){
            return next(err);
        }
        console.log('parsed the multipart request');
        const postContent = fields.postContent;
        var postImg = files.postImg;
        console.log('Path of the image >>>', postImg.path);
        // if the postImg exists,
        if (postImg && postImg.size > 0){
            console.log('Got a image >>>', postImg.name);
            // upload the original image to s3
            s3upload.original(postImg, 'postImg', now, userId, (err, imageUrl)=>{
                if (err){
                    return next(err);
                }
                console.log('Uploaded the post image');
                // post infomations
                const diary = {
                    category : 0, //diary
                    userId : userId,
                    postImg : imageUrl,
                    postContent : postContent,
                    postDate : now,
                    postLikeUsers : [],
                    reply : [] 
                }
                // create a document of the post on the post collection of the db, 'moundary'
                Post.recordPost(diary, (err, postId)=>{
                    if (err){
                        return next(err);
                    }
                    console.log('Recorded the post on the db');
                    // delete the temporary file in upload folder
                    fs.unlink(postImg.path, (err)=>{
                        if (err){
                            data = {
                                msg : 'fail to delete the temporary file'
                            }
                            res.json(data);
                            return;
                        }
                        console.log('Removed the temporary image of the post');
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