const express = require('express');
const router = express.Router();
const User = require('../model/users.js');
const Post = require('../model/posts.js');
const s3upload = require('./s3upload.js');
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
    const profileUserId = req.query.profileUserId;  //session에서 긁지 않고 요청으로 받는다.
    const userId = req.query.userId;
    User.getProfile(profileUserId, userId, (err, result)=>{
        if (err){
            return next(err);
        }
        const data = {
            msg : 'success',
            userInfo : result
        }
        res.json(data);
    });
}

function profileUpdatePage(req, res, next){
    const userId = req.query.userId;
    User.getBabyAge(userId, (err,result)=>{
        if (err){
            return next(err);
        }
        const data = {
            msg : 'success',
            babyAge : result
        }
    });
}

function modifyProfile(req, res, next){
    const now = new Date();
    const userId = req.query.userId;
    const updateCode = req.body.updateCode;
    var query = {};
    var data;
    switch(updateCode){
        case 1: // 커버 이미지 수정
        const coverImg = req.body.coverImg;
        s3upload.original(coverImg.path, 'coverImg', now, userId, (err, imageUrl)=>{
            if (err){
                return next(err);
            }
            query = {
                coverImg : coverImg
            }
            User.updateUser(userId, query, (err, result)=>{
                if (err){
                    return next(err);
                }
                data={
                    msg : 'success',
                    updateCode : updateCode
                }
                res.json(data);
            });
        });
        case 2: //프로필 이미지 수정
        const profileImg = req.body.profileImg;
        const profilePath = profileImg.path;
        // s3에 원본 이미지 업로드
        s3upload.original(profilePath, 'profileImg', now, userId, (err, imageUrl)=>{
            if (err){
                return next(err);
            }
            // 썸네일 이미지 변환후 s3에 이미지 업로드
            s3upload.thumbnail(profilePath, 'profileThumbnail', now, userId, (err, thumbnailUrl)=>{
                if (err){
                    return next(err);
                }
                // 유저 정보에서 프로필 이미지 url 수정
                query = {
                    profileImg : imageUrl,
                    profileThumbnail : thumbnailUrl
                }
                User.updateUser(userId, query, (err, result)=>{
                    if (err){
                        return next(err);
                    }
                    // 유저가 쓴 모든 글과 댓글들에서 프로필썸네일 url 수정
                    query = {
                        profileThumbnail : thumbnailUrl
                    }
                    Post.updatePostUserInfo(userId, query, (err, results)=>{
                        if (err){
                            return next(err);
                        }
                        // 응답
                        data = {
                            msg : 'success',
                            updateCode : updateCode
                        }
                        res.json(data);
                        // 임시 폴더에 있는 이미지 모두 삭제
                        fs.unlink(profilePath, (err)=>{
                            if (err){
                                console.log('Fail to delete a temporary file >>>', profilePath);
                            }
                            else{
                                console.log('Removed the temporary image of the post');
                            }
                            const thumbnailPath = __dirname+'/../upload' + 'thumbnail_'+pathUtil.basename(profilePath);
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
        case 3: // 닉네임 수정
        query = {
            nickname : req.body.nickname
        }
        User.updateUser(userId, query, (err, result)=>{
            if (err){
                return next(err, null);
            }
            User.updatePostUserInfo(userId, query, (err, results)=>{
                if (err){
                    return next(err, null);
                }
                data = {
                    msg : 'success',
                    updateCode : updateCode
                }
                res.json(data);
            });
        });
        case 4: // 주소수정
        query = {
            userAddress : req.body.address
        }
        User.updateUser(userId, query, (err, result)=>{
            if (err){
                return next(err, null);
            }
            data = {
                msg : 'success',
                updateCode : updateCode
            }
            res.json(data);
        });
        case 6: // 아이 생년월일 수정
        const babyId = req.body.babyId;
        const age = req.body.babyAge;
        var babyAge = new Date();
        babyAge.setFullYear(parseInt(age.substring(0,4)));
        babyAge.setMonth(parseInt(age.substring(5,6))-1);
        babyAge.setDate(parseInt(age.substring(7,8)));
        User.updateBabyAge(userId, babyId, babyAge, (err, result)=>{
            if (err){
                return next(err);
            }
            data = {
                msg : 'success',
                updateCode : updateCode
            }
            res.json(data);
        });
        case 5: // 아이 추가
        query['$push']['baby'] = {
            babyAge : req.body.addBaby
        }
        User.updateUser(userId, query, (err, result)=>{
            if (err){
                return next(err);
            }
            data = {
                msg : 'success',
                updateCode : updateCode
            }
            res.json(data);
        });
    }
}

function findFriends(req, res, next){
    const userId = req.query.userId;

}

function requestFriend(req, res, next){
    
}

function deleteFriend(req, res, next){
    
}

module.exports = router;