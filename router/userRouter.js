const express = require('express');
const router = express.Router();

// 프로필 페이지
router.get('/user', profile);

// 친구 신청/취소/수락/거절
router.put('/user/:request', requestFriend)

// 프로필 수정 페이지, 프로필 수정
router.route('/user/update')
    .get(profileUpdatePage)
    .put(modifyProfile);

// 친구 찾기, 친구 삭제
router.route('/user/friends')
    .get(findFriends)
    .delete(deleteFriend);

function profile(req, res, next){

}

function requestFriend(req, res, next){
    
}

function profileUpdatePage(req, res, next){
    
}

function modifyProfile(req, res, next){
    
}

function findFriends(req, res, next){
    
}

function deleteFriend(req, res, next){
    
}

module.exports = router;