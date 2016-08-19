const express = require('express');
const router = express.Router();
const Post = require('../model/posts.js');

// 정보글 검색
router.get('/search', searchPost);

// 검색 추천
router.get('/search/candidate', recommandWords);

function searchPost(req, res, next){
    const userId = req.query.userId;
    const endPost = req.query.endPost;
    const postCount = req.query.postCount;
    const word = req.query.word;
    Post.getInfoPostsByWord(word, endPost, userId, postCount, (err, results)=>{
        if (err){
            return next(err);
        }
        console.log('preparing to response');
        var data = {
            msg : 'success',
            page : {
                postCount : results.length
            },
            data : results
        }
        if (results.length == 0){
            data.page.endPost = null;
        } else {
            data.page.endPost = results[results.length-1]._id;
        }
        res.json(data);
    });
}

function recommandWords(req, res, next){

}

module.exports = router;
