const express = require('express');
const router = express.Router();

// 정보글 검색
router.get('/search', searchPost);

// 검색 추천
router.get('/search/candidate', recommandWords);

function searchPost(req, res, next){
    const userId = req.query.userId,
    const word = req.query.word;
    
}

function recommandWords(req, res, next){

}

module.exports = router;
