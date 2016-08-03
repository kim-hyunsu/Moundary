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
    const postId = req.query.postId;
    const endPost = req.query.endPost;
    Post.getReplies(endPost, postId, 20, (err, results)=>{
        if (err){
            return next(err);
        }
        endReply = results.endReply;
        delete results.endReply;
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
    Post.recordReply(reply, (err, results)=>{
        if (err){
            return next(err);
        }
        console.log('Uploaded result', results);
        res.json({postId : reply.postId});
    });
}

function modifyReply(req, res, next){

}

function deleteReply(req, res, next){

}

function likeReply(req, res, next){
    
}

module.exports = router;