const express = require('express');
const router = express.Router();
const Post = require('../model/posts.js');
const User = require('../model/users.js');
const Notification  = require('../model/notifications.js');
const fcmPush = require('./push.js');
var err = new Error();

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
    const userId = req.query.userId;
    const postId = req.query.postId;
    if (!userId){
        err.code = 401;
        return next(err);
    }
    if (!postId){
        err.code = 400;
        return next(err);
    }
    const endReply = req.query.endReply;
    const replyCount = parseInt(req.query.replyCount);
    Post.getReplies(endReply, userId, postId, replyCount, (err, results, endReply)=>{
        if (err){
            err.code = 404;
            return next(err);
        }
        const data = {
            msg : 'success',
            replyPage : {
                replyCount : results.length,
                endReply : endReply
            },
            data : results
        }
        res.json(data);
        // Notification.confirmAlteration(userId, postId, (err)=>{
        //     if (err){
        //         console.log('FAIL TO CONFIRM A NOTIFICATION OF USERID >>>', userId);
        //     }
        // });
    });
}

function writeReply(req, res, next){
    console.log("Let's start to write a reply");
    const now = new Date();
    userId = req.query.userId;
    postId = req.body.postId;
    if (!userId){
        err.code = 401;
        return next(err);
    }
    if (!postId){
        err.code = 400;
        return next(err);
    }
    const reply = req.body;
    reply.userId = userId;
    console.log('This is willing to be uploaded reply >>>', reply);
    // reply = {postId : , replyContent : , userId : , replyDate : }
    Post.recordReply(reply, (err, updatedReplyList)=>{
        if (err){
            err.code = 500;
            return next(err);
        }
        console.log('Uploaded result');
        const data = {
            msg : 'success',
            data : updatedReplyList
        }
        res.json(data);
        const pushData = {
            pushType : 0,  // 댓글/좋아요: 0, 세일/나눔/이벤트/상점: 1, 친구신청 : 2
            postId : reply.postId,
            pusherId : reply.userId, // 리플 쓴 사람 아이디
            pusherNickname : updatedReplyList[updatedReplyList.length-1].nickname, // 리플 쓴 사람 아이디
            category: 0, // 댓글
            img : updatedReplyList[updatedReplyList.length-1].profileThumbnail,
            content : updatedReplyList[updatedReplyList.length-1].replyContent
        }
        Notification.addReplyPush(pushData, (err, token)=>{ //pushData에 pullerId 추가해서 저장
            if (err){
                return console.log('FAIL TO SAVE A PUSHDATA OR GET TOKEN OF >>>', reply.userId);
            }
            fcmPush([token], pushData, (err, response)=>{
                if (err){
                    console.log('FAIL TO PUSH A POST OF %s >>> %s', reply.postId, reply.userId);
                }
                console.log('PUSH COMPLETE >>>', response);
            });
        });
    });
}

function modifyReply(req, res, next){
    const userId = req.query.userId;
    const postId = req.body.postId;
    const replyId = req.body.replyId;
    const replyContent = req.body.replyContent;
    if (!userId){
        err.code = 401;
        return next(err);
    }
    if(!postId || !replyId){
        err.code = 400;
        return next(err);
    }
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
            'reply.$.replyContent' : replyContent
    }
    Post.updateReply(userId, postId, replyId, query, (err)=>{
        if (err){
            err.code = 500;
            return next(err);
        }
        const data = {
            msg : 'success',
            data : {
                replyId : replyId,
                postId : postId
            }
        }
        res.json(data);
    });
}

function deleteReply(req, res, next){
    const userId = req.query.userId;
    const postId = req.body.postId;
    const replyId = req.body.replyId;
    if (!userId){
        err.code = 401;
        return next(err);
    }
    if (!postId || !replyId){
        err.code = 400;
        return next(err);
    }
    const query = {
        $pull : {
            reply : {
                _id : replyId,
                userId : userId
            }
        },
        $inc : {
            replyCount : -1
        }
    }
    Post.updateReply(userId, postId, replyId, query, (err)=>{
        if (err){
            err.code = 500;
            return next(err);
        }
        const data = {
            msg : 'success',
            data : {
                replyId : replyId,
                postId : postId
            }
        }
        res.json(data);
    });
}

function likeReply(req, res, next){
    // const userId = req.query.userId;
    // const postId = req.body.postId;
    // const replyId = req.body.replyId;
    // var query;
    // Post.checkReplyLiked(userId, postId, replyId, (err, liked)=>{
    //     if (err){
    //         return next(err);
    //     }
    //     if (!liked){
    //         // 아직 좋아요 안함
    //         query = {
    //             $push : {
    //                 'reply.$.replyLikeUsers' : userId
    //             },
    //             $inc : {
    //                 'reply.$.replyLikeCount' : 1
    //             }
    //         }
    //     } else {
    //         // 이미 좋아요 함
    //         query = {
    //             $pull : {
    //                 'reply.$.replyLikeUsers' : userId
    //             },
    //             $inc : {
    //                 'reply.$.replyLikeCount' : -1
    //             }
    //         }
    //     }
    //     Post.likeReply(postId, replyId, query, (err)=>{
    //         if (err){
    //             return next(err);
    //         }
    //         const data = {
    //             msg : 'success',
    //             data : {
    //                 replyId : replyId,
    //                 postId : postId
    //             }
    //         }
    //         res.json(data);
    //     });
    // });
}

module.exports = router;