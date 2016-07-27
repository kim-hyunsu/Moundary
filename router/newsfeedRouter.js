const express = require('express');
const router = express.Router();
const async = require('async');
const Post = require('./model/posts.js');
const User = require('./model/users.js');

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

function newsList(req, res, next){

    const endPost = req.query.endPost;
    const friend = req.query.friend;
    const userId = req.session.userId;

    var callback = function(err, results){
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
        const data;
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

module.exports = router;