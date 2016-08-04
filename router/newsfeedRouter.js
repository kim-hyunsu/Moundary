const express = require('express');
const router = express.Router();
const formidable = require('formidable');

const fs = require('fs');
const Post = require('../model/posts.js');
const s3upload = require('./s3upload.js');

// 친구소식 목록, 글 쓰기
router.route('/post')
    .get(newsList)
    .post(writePost);

// 글 상세페이지, 글 수정, 글 삭제
router.route('/post/detail')
    .get(postDetail)
    .put(modifyPost)
    .delete(deletePost);

// 글 좋아요
router.put('/post/like', likePost);

// 내 이야기 목록
router.get('/post/mine', myPostList);

// newsfeed posts
function newsList(req, res, next){
    console.log('get (get) request of /post');
    const endPost = req.query.endPost;
    const userId = req.query.userId;

    Post.getPosts(endPost, userId, 60, (err, results)=>{
        if(err){
            return next(err);
        }
        const hasFriend = results.hasFriend;
        delete results.hasFriend;
        const data = {
            msg : 'success',
            hasFriend : hasFriend,
            page : {
                postCount : results.length,
                endPost : results[0]._id
            },
            data : results
        }
        res.json(data);
    });
}


function myPostList(req, res, next){
    console.log('get (get) request of /post/mine');
    const endPost = req.query.endPost;
    const userId = req.query.userId;

    Post.getMyPosts(endPost, userId, 60, (err, results)=>{
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

function writePost(req, res, next){
    console.log('get (post) request of /post');
    const now = new Date();
    // bring the userId from the session
    const userId = req.query.userId;
    var form = new formidable.IncomingForm();
    form.encoding = 'utf-8';
    form.keepExtensions = true;  // save with extension
    form.uploadDir = __dirname + '/../upload'; // saved a temporary image file automatically in upload folder

    // multipart parsing
    form.parse(req, (err, fields, files)=>{
        if (err){
            return next(err);
        }
        console.log('parsed the multipart request');
        const postContent = fields.postContent;
        var postImg = files.postImg;
        // upload the original image to s3
        s3upload.original(postImg.path, 'postImg', now, userId, (err, imageUrl)=>{
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
            const diary = {
                category : 0, //diary
                userId : userId,
                postImg : imageUrl,
                postContent : postContent,
                postDate : now,
                postLikeUsers : [],
                replyCount : 0,
                reply : [] 
            }
            // create a document of the post on the post collection of the db, 'moundary'
            Post.recordPost(diary, (err, postId)=>{
                if (err){
                    return next(err);
                }
                console.log('Recorded the post on the db');
                const data = {
                    msg: 'success',
                    postId : postId.toString()
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
    });
}

function postDetail(req, res, next){
    console.log('get (get) request of /post/detail');
    const postId = req.query.postId;
    Post.getPostDetail(postId, (err, results)=>{
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


function modifyPost(req, res, next){

}

function deletePost(req, res, next){

}

function likePost(req, res, next){

}


module.exports = router;