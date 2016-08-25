const express = require('express');
const router = express.Router();
const Post = require('../model/posts.js');
var err = new Error();

// 정보글 검색
router.get('/search', searchPost);

// 검색 추천
router.get('/search/candidate', recommandWords);

function searchPost(req, res, next){
    const userId = req.query.userId;
    if (!userId){
        err.code = 401;
        return next(err);
    }
    const endPost = req.query.endPost;
    const postCount = req.query.postCount;
    const word = req.query.word;
    Post.getInfoPostsByWord(word, endPost, userId, postCount, (err, results)=>{
        if (err){
            err.code = 500;
            return next(err);
        }
        console.log('preparing to response');
        var data = {
            msg : 'success',
            postCount : results.length,
            data : results
        }
        if (results.length == 0){
            data.endPost = null;
        } else {
            data.endPost = results[results.length-1]._id;
        }
        res.json(data);
    });
}

function recommandWords(req, res, next){
    const word = req.query.word;
    Post.getContentsKeyword(word, (err, wordList)=>{
        if (err){
            err.code = 500;
            return next(err);
        }
        const data = {
            msg : 'success',
            data : wordList
        }
        res.json(data);
    });
}

module.exports = router;
