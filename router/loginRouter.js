const express = require('express');
const router = express.Router();
const fs = require('fs');
const async = require('async');
const pathUtil = require('path');
const User = require('../model/users.js');
const s3upload = require('./s3upload.js');
var err = new Error();

router.post('/auth/signup', signup);

router.post('/auth/facebook', FBLogin);

router.post('/auth/kakao', kakaoLogin);

function signup(req, res, next){
    const uuid = req.body.uuid;
    const fcmToken = req.body.fcmToken;
    var age = req.body.babyAge;
    const nickname = req.body.nickname;
    const userAddress = {
        area1 : req.body.area1,
        area2 : req.body.area2,
        area3 : req.body.area3,
        area4 : req.body.area4,
        area5 : req.body.area5
    }
    const coverImg = req.body.coverImg;
    const profileImg = req.body.profileImg;
    if (!uuid || !fcmToken || !age || !nickname || age.length>8 || age.length==0 || !userAddress.area1 || !userAddress.area2 || !userAddress.area4 || !userAddress.area5){
        if (coverImg){
            fs.stat(coverImg.path, (err, stats)=>{
                if (!err){
                    fs.unlink(coverImg.path, (err)=>{
                        console.log('FAIL TO UNLINK THE IMAGE IN UPLOAD FILE >>>', coverImg.path);
                    });
                }
            });
        }
        if (profileImg){
            fs.stat(profileImg.path, (err, stats)=>{
                if (!err){
                    fs.unlink(profileImg.path, (err)=>{
                        console.log('FAIL TO UNLINK THE IMAGE IN UPLOAD FILE >>>', profileImg.path);
                    });
                }
            });
        }
        err.code = 400;
        return next(err);
    }
    var query = {};
    async.parallel([
        function(cb){
            if (coverImg && coverImg.size>0){
                s3upload.original(coverImg.path, coverImg.type, 'coverImg', uuid, (err, coverImageUrl)=>{
                    if (err){
                        return cb(err);
                    }
                    query.coverImg = coverImageUrl;
                    cb();
                });
            } else {
                cb();
            }
        },
        function(cb){
            if (profileImg && profileImg.size>0){
                if (profileImg.size < 339){
                    async.parallel([
                        function(s3cb){
                            s3upload.original(profileImg.path, profileImg.type, 'profileImg', uuid, s3cb);
                        },
                        function(s3cb){
                            s3upload.original(profileImg.path, profileImg.type, 'profileThumbnail', uuid, s3cb);
                        }
                    ], (err, urls)=>{
                        if (err){
                            // s3upload.delete(urls[0], (err,result)=>{
                            //     if (err){
                            //         console.log('FAIL TO DELETE THE IMAGE IN S3 >>>', urls[0]);
                            //     }
                            // });
                            // s3upload.delete(urls[1], (err, result)=>{
                            //     if (err){
                            //         console.log('FAIT TO DELETE THE IMAGE IN S3 >>>', urls[1]);
                            //     }
                            // });
                            return cb(err);
                        }
                        query.profileImg = urls[0];
                        query.profileThumbnail = urls[1];
                        cb();
                    });
                } else {
                    s3upload.originalAndThumbnail(profileImg.path, profileImg.type, 'profileImg', uuid, (err, profileImageUrl, profileThumbnailUrl)=>{
                        if (err){
                            cb(err);
                        }
                        query.profileImg = profileImageUrl;
                        query.profileThumbnail = profileThumbnailUrl;
                        cb();
                    });
                }
            } else {
                cb();
            }
        }
    ], (err)=>{
        if (err){
            err.code = 500;
            next(err);
            s3upload.delete(query.coverImg, (err, result)=>{
                if (err){
                    console.log('FAIL TO DELETE THE IMAGE IN S3 >>>', query.coverImg);
                }
            });
            s3upload.delete(query.profileImg, (err, result)=>{
                if (err){
                    console.log('FAIL TO DELETE THE IMAGE IN S3 >>>', query.profileImg);
                }
            });
            s3upload.delete(query.profileThumbnail, (err, result)=>{
                if (err){
                    console.log('FAIL TO DELETE THE IMAGE IN S3 >>>', query.profileThumbnail);
                }
            });
        } else {
            query.uuid = uuid;
            query.fcmToken = fcmToken;
            query.nickname = nickname;
            query.userAddress = userAddress;
            var babyAge = new Date();
            babyAge.setFullYear(parseInt(age.substring(0,4)));
            babyAge.setMonth(parseInt(age.substring(4,6))-1);
            babyAge.setDate(parseInt(age.substring(6,8)));
            query.babyAge = babyAge;
            User.createUser(query, (err, result)=>{
                if (err){
                    err.code = 500;
                    next(err);
                } else {
                    const data = {
                        msg : 'success',
                        userId : result._id
                    }
                    res.json(data);
                }
            });
        }
        if (coverImg){
            fs.stat(coverImg.path, (err, stats)=>{
                if (!err){
                    fs.unlink(coverImg.path, (err)=>{
                        console.log('FAIL TO UNLINK THE IMAGE IN UPLOAD FILE >>>', coverImg.path);
                    });
                }
            });
        }
        var thumbnailPath;
        if (profileImg){
            thumbnailPath = __dirname+'/../upload/thumb_'+pathUtil.basename(profileImg.path);
            fs.stat(profileImg.path, (err, stats)=>{
                if (!err){
                    fs.unlink(profileImg.path, (err)=>{
                        console.log('FAIL TO UNLINK THE IMAGE IN UPLOAD FILE >>>', profileImg.path);
                    });
                }
            });
        }
        if (thumbnailPath){
            fs.stat(thumbnailPath, (err, stats)=>{
                if (!err){
                    fs.unlink(thumbnailPath, (err)=>{
                        console.log('FAIL TO UNLINK THE IMAGE IN UPLOAD FILE >>>', thumbnailPath);
                    });
                }
            });
        }
    });
}
//oldone
// After authentication of external services(facebook, kakao),
// user enters (policyAgree, personalInfoAgree, nickname, profileImg, coveImg, userAddress, babyAge);
// function signup(req, res, next){
//     const now = new Date();
//     const uuid = req.body.uuid;
//     const fcmToken = req.body.fcmToken;
//     console.log('parsed the multipart request');
//     const coverImg = req.body.coverImg;
//     const profileImg = req.body.profileImg;
//     var age = req.body.babyAge;
//     var babyAge = new Date();
//     babyAge.setFullYear(parseInt(age.substring(0,4)));
//     babyAge.setMonth(parseInt(age.substring(4,6))-1);
//     babyAge.setDate(parseInt(age.substring(6,8)));
//     var record = function(err, profileImageUrl, profileThumbnailUrl, coverImageUrl){
//         if (err){
//             return next(err);
//         }
//         var query = {
//             uuid : uuid,
//             fcmToken : fcmToken,
//             nickname : req.body.nickname,
//             profileImg : profileImageUrl,
//             profileThumbnail : profileThumbnailUrl,
//             coverImg : coverImageUrl,
//             userAddress : {
//                 area1 : req.body.area1,
//                 area2 : req.body.area2,
//                 area3 : req.body.area3,
//                 area4 : req.body.area4,
//                 area5 : req.body.area5
//             },
//             baby : [{
//                 babyAge: babyAge
//             }],

//         }
//         // if (req.body.policyAgreeDate){
//         //     query.policyAgreeDate = req.body.policyAgreeDate;
//         // }
//         // if (req.body.personalInfoAgreeDate){
//         //     query.personalInfoAgreeDate = req.body.personalInfoAgreeDate;
//         // }
//         User.createUser(query, (err, result)=>{
//             if (err){
//                 return next(err);
//             }
//             const data ={
//                 msg : 'success',
//                 userId : result._id
//             }
//             res.json(data);
//         });
//     }
//     s3upload.original(profileImg.path, profileImg.type, 'profileImg', uuid, (err, profileImageUrl)=>{
//         if (err){
//             return next(err);
//         }
//         s3upload.thumbnail(profileImg.path, profileImg.type, 'profileThumbnail', uuid, (err, profileThumbnailUrl)=>{
//             if (err){
//                 return next(err);
//             }
//             s3upload.original(coverImg.path, coverImg.type, 'coverImg', uuid, (err, coverImageUrl)=>{
//                 if (err){
//                     return next(err);
//                 }
//                 record(null, profileImageUrl, profileThumbnailUrl, coverImageUrl);
//                 fs.unlink(profileImg.path, (err)=>{
//                     if (err){
//                         console.log(err);
//                     }
//                     thumbnailPath = __dirname+'/../upload/thumb_'+pathUtil.basename(profileImg.path);
//                     fs.unlink(thumbnailPath, (err)=>{
//                         if (err){
//                             console.log(err);
//                         }
//                         fs.unlink(coverImg.path, (err)=>{
//                             if (err){
//                                 console.log(err);
//                             }
//                         })
//                     });
//                 });
//                 // TODO- delete temporary file 
//             });
//         });
//     });     
// }

// In process of the external authentication,
// we get user's profile image and email address from the token.
// Since the profile image is an url,
// we should use a http client module to request to get image data corresponding to the url.
// Consequently, we can create a image file using a fs module.
// Finally, we can make a thumbnail image from the file.
function registerUser(joinPath, token, callback){
    // TODO-가입경로 가져오기
    //     -token에서 이메일 정보 가져오기
    var userEmail = token;
    const register ={
        userEmail : userEmail,
        joinPath : joinPath,
        friendList :[]
    }
    User.createUser(register, (err, result)=>{
        if (err){
            return callback(err ,null);
        }
        callback(null, result);
    })
}

function FBLogin(req, res, next){
    const userEmail = req.body.userEmail;
    //registerUser
    registerUser(1,userEmail,(err, result)=>{
        if (err){
            return next(err);
        }
        console.log('FBLOGIN result >>>' , result)
        res.end();
    })
}

function kakaoLogin(req, res, next){

    //registerUser
}

module.exports = router;