const express = require('express');
const router = express.Router();

// 댓글 목록, 댓글 쓰기, 댓글 수정, 댓글 삭제
router.route('/reply')
    .get(replyList)
    .post(writeReply)
    .put(modifyReply)
    .delete(deleteReply);

// 댓글 좋아요
router.put('/reply/like', likeReply);

function replyList(req, res, next){

}

function writeReply(req, res, next){

}

function modifyReply(req, res, next){

}

function deleteReply(req, res, next){

}

function likeReply(req, res, next){
    
}

module.exports = router;