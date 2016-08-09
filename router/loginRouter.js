const express = require('express');
const router = express.Router();

const User = require('../model/users.js');
const s3upload = require('./s3upload.js');

router.post('/auth/signup', signup);

router.post('/auth/facebook', FBLogin);

router.post('/auth/kakao', kakaoLogin);

// After authentication of external services(facebook, kakao),
// user enters (policyAgree, personalInfoAgree, nickname, profileImg, coveImg, userAddress, babyAge);
function signup(req, res, next){
    const now = new Date();
    const userId = req.query.userId;
    console.log('parsed the multipart request');
    const coverImg = req.body.coverImg;
    const profileImg = req.body.profileImg;
    var age = req.body.babyAge;
    var babyAge = new Date();
    babyAge.setFullYear(parseInt(age.substring(0,4)));
    babyAge.setMonth(parseInt(age.substring(5,6))-1);
    babyAge.setDate(parseInt(age.substring(7,8)));
    var record = function(err, profileImageUrl, profileThumbnailUrl, coverImageUrl){
        if (err){
            return next(err);
        }
        var query = {
            policyAgreeDate : req.body.policyAgreeDate,
            personalInfoAgreeDate : req.body.personalInfoAgreeDate,
            nickname : req.body.nickname,
            profilImg : profileImageUrl,
            profileThumbnail : profileThumbnailUrl,
            coverImg : coverImageUrl,
            userAddress : {
                area1 : req.body.area1,
                area2 : req.body.area2,
                area3 : req.body.area3,
                area4 : req.body.area4,
                area5 : req.body.area5
            },
            baby : [{
                babyAge: babyAge
            }],

        }
        User.updateUser(userId, query, (err, userId)=>{
            if (err){
                return next(err);
            }
            const data ={
                msg : 'success',
                userId : userId
            }
            res.json(data);
        });
    }
    s3upload.original(profileImg.path, profileImg.type, 'profileImg', now, userId, (err, profileImageUrl)=>{
        if (err){
            return next(err);
        }
        s3upload.thumbnail(profileImg.path, profileImg.type, 'profileThumbnail', now, userId, (err, profileThumbnailUrl)=>{
            if (err){
                return next(err);
            }
            s3upload.original(coverImg.path, coverImg.type, 'coverImg', now, userId, (err, coverImageUrl)=>{
                if (err){
                    return next(err);
                }
                record(null, profileImageUrl, profileThumbnailUrl, coverImageUrl);
                // TODO- delete temporary file 
            });
        });
    });     
}

// In process of the external authentication,
// we get user's profile image and email address from the token.
// Since the profile image is an url,
// we should use a http client module to request to get image data corresponding to the url.
// Consequently, we can create a image file using a fs module.
// Finally, we can make a thumbnail image from the file.
function registerUser(token, callback){
    // TODO-가입경로 가져오기
    //     -token에서 이메일 정보 가져오기
    var userEmail;
    var joinPath;
    const register ={
        userEmail : userEmail,
        joinPath : joinPath,
        friendList :[],
        alarm : {
            moudaryAlarm : true,
            replyAlarm : true,
            likeAlarm : true
        },
        interest : {
            sale : true,
            store : true,
            event : true,
            share : true
        }
    }
}

function FBLogin(req, res, next){

    //registerUser
}

function kakaoLogin(req, res, next){

    //registerUser
}

module.exports = router;