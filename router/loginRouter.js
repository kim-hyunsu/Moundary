const express = require('express');
const router = express.Router();
const formidable = require('formidable');

const User = require('../model/users.js');

router.put('/auth/signup',signup);

router.post('/auth/facebook', FBLogin);

router.post('/auth/kakao', kakaoLogin);

// After authentication of external services(facebook, kakao),
// user enters (policyAgree, personalInfoAgree, nickname, profileImg, coveImg, userAddress, babyAge);
function signup(req, res, next){
    const now = new Date();
    const userId = req.query.userId;
    var form = new formidable.IncomingForm();
    form.encoding = 'utf-8';
    form.keepExtensions = true;
    form.uploadDir = __dirname + '/../upload';

    form.parse(req, (err, fields, files)=>{
        var data;
        if (err){
            return next(err);
        }
        console.log('parsed the multipart request');
        const coverImg = files.coverImg;
        const profileImg = files.profileImg;

        var record = function(err, profileImageUrl, profileThumbnailUrl, coverImageUrl){
            if (err){
                return next(err);
            }
            var data = {
                policyAgreeDate : fields.policyAgreeDate,
                personalInfoAgreeDate : fields.personalInfoAgreeDate,
                nickname : fields.nickname,
                profilImg : profileImageUrl,
                profileThumbnail : profileThumbnailUrl,
                coverImg : coverImageUrl,
                userAddress : {
                    area1 : fields.area1,
                    area2 : fields.area2,
                    area3 : fields.area3,
                    area4 : fields.area4,
                    area5 : fields.area5
                },
                babyAge : [fields.babyAge],

            }
            User.updateUser(userId, data, (err, userId)=>{
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
        s3upload.original(profileImg.path, 'profileImg', now, userId, (err, profileImageUrl)=>{
            if (err){
                return next(err);
            }
            s3upload.thumbnail(profileImg.path, 'profileThumbnail', now, userId, (err, profileThumbnailUrl)=>{
                if (err){
                    return next(err);
                }
                s3upload.original(coverImg.path, 'coverImg', now, userId, (err, coverImageUrl)=>{
                    if (err){
                        return next(err);
                    }
                    record(null, profileImageUrl, profileThumbnailUrl, coverImageUrl);
                    // TODO- delete temporary file 
                });
            });
        });     
    });
}

// In process of the external authentication,
// get user's profile image and email address from the token.
// Since the profile image is an url,
// use a http client module to request to get image data corresponding to the url.
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