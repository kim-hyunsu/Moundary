const express = require('express');
const router = express.Router();
const async = require('async');
const fs = require('fs');
const User = require('../model/users.js');
const Post = require('../model/posts.js');
const Holder = require('../model/friendsHold.js');
const s3upload = require('./s3upload.js');
const log = console.log;
// 프로필 페이지, 프로필 수정
router.route('/user')
    .get(profile)
    .put(modifyProfile);

//내 프로필 가져오기
router.get('/user/mine', myProfile);

// 근처 유저 목록 가져오기
router.get('/user/list', userList);

// 유저 검색
router.get('/user/search', searchUsers);

// 친구 목록 가져오기
router.get('/friend', friendList);

// 친구 신청 목록 가져오기
router.get('/friend/candidate', friendCandidates)

// 친구 신청/취소/수락/거절/삭제
router.put('/friend/:request', requestFriend)

function searchUsers(req, res, next){

}

function friendCandidates(req, res, next){
    const userId = req.query.userId;

    Holder.getFriendCandidates(userId, (err, result)=>{
        if (err){
            return next(err);
        }
        const data = {
            msg : 'success',
            data : result
        }
        res.json(data);
    });
}

function friendList(req, res, next){
    const userId = req.query.userId;
    const endUser = req.query.endUser;
    const userCount = req.query.userCount;
    User.getFriends(endUser, userId, userCount, (err, result)=>{
        if (err){
            return next(err);
        }
        const data = {
            msg : 'success',
            data : result
        }
        res.json(data);
    });
}

function profile(req, res, next){
    console.log('get (get) request of /user');
    const profileUserId = req.query.profileUserId;  //session에서 긁지 않고 요청으로 받는다.
    const userId = req.query.userId;
    User.getProfile(profileUserId, userId, (err, result)=>{
        if (err){
            return next(err);
        }
        console.log('GOT THE PROFILE INFORMATION');
        const data = {
            msg : 'success',
            data : result
        }
        res.json(data);
    });
}

function myProfile(req, res, next){
    const userId = req.query.userId;
    User.getMyProfile(userId, (err,result)=>{
        if (err){
            return next(err);
        }
        const data = {
            msg : 'success',
            data : result
        }
        res.json(data);
    });
}

function modifyProfile(req, res, next){
    const now = new Date();
    const userId = req.query.userId;
    var query; // 수정할 정보를 담을 query

    const cb = function(err, result){
        if (err){
            return next(err);
        }
        const data = {
            msg : 'success',
            data : result
        }
        res.json(data);
    }

    //커버사진 수정
    const coverImg = req.body.coverImg;
    if (coverImg){
        s3upload.original(coverImg.path, coverImg.type, 'coverImg', userId, (err, imageUrl)=>{
            if (err){
                return cb(err);
            }
            query = {
                coverImg : imageUrl
            }
            User.updateUser(userId, query, cb);
            fs.unlink(coverImg.path, (err)=>{
                if (err){
                    console.log('FAIL TO DELETE A NEW COVER IMAGE >>>', coverImg.path);
                }
                else{
                    console.log('A NEW COVER IMAGE DELETED');
                }
            });
        });
    } else {
        // 커버사진 삭제
    }

    //프로필 수정
    const profileImg = req.body.profileImg;
    if (profileImg){
        const profilePath = profileImg.path;
        // s3에 원본 이미지 업로드
        s3upload.original(profilePath, profileImg.type, 'profileImg', userId, (err, imageUrl)=>{
            if (err){
                return cb(err);
            }
            // 썸네일 이미지 변환후 s3에 이미지 업로드
            s3upload.thumbnail(profilePath, profileImg.type, 'profileThumbnail', userId, (err, thumbnailUrl)=>{
                if (err){
                    return cb(err);
                }
                // 유저 정보에서 프로필 이미지 url 수정
                query = {
                    profileImg : imageUrl,
                    profileThumbnail : thumbnailUrl
                }
                User.updateUser(userId, query, (err, updatedUser)=>{
                    if (err){
                        return cb(err);
                    }
                    // 유저가 쓴 모든 글과 댓글들에서 프로필썸네일 url 수정
                    const queryForPost = {
                        profileThumbnail : thumbnailUrl
                    }
                    Post.updatePostUserInfo(userId, queryForPost, (err, results)=>{
                        cb(err, updatedUser);
                        // 임시 폴더에 있는 이미지 모두 삭제
                        fs.unlink(profilePath, (err)=>{
                            if (err){
                                console.log('Fail to delete a temporary file >>>', profilePath);
                            }
                            else{
                                console.log('Removed the temporary image of the post');
                            }
                            const thumbnailPath = __dirname+'/../upload' + 'thumb_'+pathUtil.basename(profilePath);
                            fs.unlink(thumbnailPath, (err)=>{
                                if (err){
                                    console.log('Fail to delete a temporary file >>>', thumbnailPath);
                                }
                                else{
                                    console.log('Removed the temporary image of the post');
                                }
                            });
                        });
                    });
                });
            });
        });
    } else {
        //삭제
    }

    // 닉네임 수정
    const nickname = req.body.nickname;
    if (nickname){
        query = {
            nickname : req.body.nickname
        }
        User.updateUser(userId, query, (err, updatedUser)=>{
            if (err){
                return cb(err);
            }
            User.updatePostUserInfo(userId, query, cb);
        });
    }

    // 주소 수정
    const address = {
        area1 : req.body.area1,
        area2 : req.body.area2,
        area3 : req.body.area3,
        area4 : req.body.area4,
        area5 : req.body.area5
    }
    if ( address.area1 || address.area2 || address.area3 || address.area4 || address.area5 ){
            query = {
                userAddress : address
            }
            User.updateUser(userId, query, cb);
    }

    // 아이 생년월일 수정
    const babyId = req.body.babyId;
    const age = req.body.babyAge;
    if (babyId && age){
        var babyAge = new Date();
        babyAge.setFullYear(parseInt(age.substring(0,4)));
        babyAge.setMonth(parseInt(age.substring(5,6))-1);
        babyAge.setDate(parseInt(age.substring(7,8)));
        User.updateBabyAge(userId, babyId, babyAge, cb);
    }

    // 아이 추가
    const addbaby = req.body.addBaby;
    if (addbaby){
        query = { $push : { baby : { babyAge : addbaby } } }
        User.updateUser(userId, query, cb);
    }
}


function userList(req, res, next){
    const userId = req.query.userId;
    const address = {
        area1 : req.query.area1,
        area2 : req.query.area2,
        area3 : req.query.area3,
        area4 : req.query.area4,
        area5 : req.query.area5
    }
    const ageRange = parseInt(req.query.ageRange);
    const endUser = req.query.endUser;
    const userCount = req.query.userCount;

    const cb = function(err, result){
        if (err){
            return next(err);
        }
        var data = {
            msg : 'success',
            myAddress : address,
            page : {
                userCount : result.length
            },
            data : result
        }
        if (result.length ==0){ //해당 지역에 사람이 아무도 없다면
            data.page.endUser = null;
        }
        else{
            data.page.endUser = result[result.length-1]._id;
        }
        res.json(data);
    }
    console.log('address', address);
    if ( !address.area1 && !address.area2 && !address.area3 && !address.area4 && !address.area5 ){ //주소입력이 없다면 유저가 속한 동/읍/면에서 탐색
        console.log('GETUSERSNEARBY');
        User.getUsersNearby(endUser, userId, ageRange, userCount, cb);
    }
    else{
        User.getUsersByAddress(endUser, userId, address, ageRange, userCount, cb);
    }

}

function requestFriend(req, res, next){
    const userId = req.query.userId;
    const oppositeUserId = req.body.oppositeUserId;
    log('1');
    const cb = function(err, result){
        if (err){
            return next(err);
        }
        log('2');
        res.json( { msg : 'success' } );
    }
    log('3');
    switch(req.params.request){
        case 'apply': // 친구 신청
        log('4');
        Holder.apply(userId, oppositeUserId, cb);
        break

        case 'cancel': // 친구 취소
        Holder.cancel(userId, oppositeUserId, cb);
        break

        case 'allow': // 친구 수락
        Holder.allow(userId, oppositeUserId, cb);
        break

        case 'reject': // 친구 거절
        Holder.reject(userId, oppositeUserId, cb);
        break

        case 'delete': // 친구 삭제
        Holder.delete(userId, oppositeUserId, cb);
        break
    }
}


module.exports = router;