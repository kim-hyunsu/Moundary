const express = require('express');
const router = express.Router();
const Post = require('../model/posts.js');
const User = require('../model/users.js');

// 댓글 가져오기, 댓글 쓰기, 댓글 수정, 댓글 삭제
router.route('/reply')
    .get(replyList)
    .post(writeReply)
    .put(modifyReply)
    .delete(deleteReply);

// 댓글 좋아요
router.put('/reply/like', likeReply);

function replyList(req, res, next){
    console.log('get (get) request of /reply');
    const postId = req.query.postId;
    const endReply = parseInt(req.query.endReply);
    const replyCount = parseInt(req.query.replyCount);
    Post.getReplies(endReply, postId, replyCount, (err, results, endReply)=>{
        if (err){
            return next(err);
        }
        console.log('got reply list >>>', results);
        const data = {
            msg : 'success',
            replyPage : {
                replyCount : results.length,
                endReply : endReply
            },
            data : results
        }
        res.json(data);
    });
}

function writeReply(req, res, next){
    console.log("Let's start to write a reply");
    const now = new Date();
    const reply = req.body;
    reply.userId = req.query.userId;
    reply.replyDate = now;
    console.log('This is willing to be uploaded reply >>>', reply);
    // reply = {postId : , replyContent : , userId : , replyDate : }
    Post.recordReply(reply, (err, updatedReplyList)=>{
        if (err){
            return next(err);
        }
        console.log('Uploaded result');
        const data = {
            msg : 'success',
            data : updatedReplyList
        }
        res.json(data);
    });
}

function modifyReply(req, res, next){
    const userId = req.query.userId;
    const postId = req.body.postId;
    const replyId = req.body.replyId;
    const replyContent = req.body.replyContent;
    if (!replyContent){
        const data = {
            msg : 'success',
            data : {
                replyId : replyId,
                postId : postId
            }
        }
        return res.json(data);
    }
    const query = {
        $set : {
            reply : {
                userId : userId,
                replyContent : replyContent
            }
        }
    }
    Post.updateReply(userId, postId, query, (err, updatedPost)=>{
        if (err){
            return next(err);
        }
        const data = {
            msg : 'success',
            data : updatedPost.reply
        }
        res.json(data);
    });
}

function deleteReply(req, res, next){
    const userId = req.query.userId;
    const postId = req.body.postId;
    const replyId = req.body.replyId;
    const query = {
        $pull : {
            'reply._id' : replyId
        }
    }
    Post.updateReply(userId, postId, query, (err, updatedPost)=>{
        if (err){
            return next(err);
        }
        const data = {
            msg : 'success',
            data : updatedPost.reply
        }
    });
}

function likeReply(req, res, next){
    
}

module.exports = router;