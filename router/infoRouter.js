const express = require('express');
const router = express.Router();

// 동네소식 목록, 정보글 쓰기
router.route('/info')
    .get(infoList)
    .post(writeInfo);

// 정보글 상세페이지, 정보글 수정, 정보글 삭제
router.route('/post/detail')
    .get(infoDetail)
    .put(modifyInfo)
    .delete(deleteInfo);

// 정보글 좋아요
router.put('/post/like', likeInfo);

function infoList(req, res, next){

}

function writeInfo(req, res, next){

}

function infoDetail(req, res, next){

}

function modifyInfo(req, res, next){

}

function deleteInfo(req, res, next){

}

function likeInfo(req, res, next){
    
}

module.exports = router;