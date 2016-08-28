const express = require('express');
const router = express.Router();
const async = require('async');
const fs = require('fs');
const pathUtil = require('path');
const User = require('../model/users.js');
const Post = require('../model/posts.js');
const Holder = require('../model/friendsHold.js');
const Notification = require('../model/notifications.js');
const s3upload = require('./s3upload.js');
const fcmPush = require('./push.js');
const log = console.log;
var err = new Error();

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

// 알람 목록 가져오기
router.get('/user/notification', notificationList);

// 새로운 알람 갯수 가져오기
router.get('/user/notification/count', newNotificationCount);

// 친구 목록 가져오기
router.get('/friend', friendList);

// 친구 신청 목록 가져오기
router.get('/friend/candidate', friendCandidates);

// 친구 신청/취소/수락/거절/삭제
router.put('/friend/:request', requestFriend);

function notificationList(req, res, next){
    const userId = req.query.userId;
    if (!userId){
        err.code = 401;
        return next(err);
    }
    Notification.getNotifications(userId, (err, notifications)=>{
        if (err){
            err.code = 500;
            return next(err);
        }
        const data = {
            msg : 'success',
            data : notifications
        }
        res.json(data);
        Notification.changeNewFromTrueToFalse(userId, (err)=>{
            if (err){
                console.log('FAIL TO CHANGE THE "NEW" OF NOTIFICATIONS FROM TRUE TO FALSE WHOSE >>>', userId);
            }
        });
    });
}

function newNotificationCount(req, res, next){
    const userId = req.query.userId;
    if (!userId){
        err.code = 401;
        return next(err);
    }
    Notification.getNewNotificationCount(userId, (err, notificationCount)=>{
        if (err){
            err.code = 500;
            return next(err);
        }
        const data = {
            msg : 'success',
            data : {
                notificationCount : notificationCount
            }
        }
        res.json(data);
    });
}

function searchUsers(req, res, next){
    const userId = req.query.userId;
    const nickname = req.query.nickname;
    if (!userId){
        err.code = 401;
        return next(err);
    }
    User.getUsersByNick(userId, nickname, (err, users)=>{
        if (err){
            err.code = 500;
            return next(err);
        }
        const data = {
            msg : 'success',
            data : users
        }
        res.json(data);
    });
}

function friendCandidates(req, res, next){  
    const userId = req.query.userId;
    if (!userId){
        err.code = 401;
        return next(err);
    }
    Holder.getFriendCandidates(userId, (err, result)=>{
        if (err){
            err.code = 500;
            return next(err);
        }
        const data = {
            msg : 'success',
            data : result
        }
        res.json(data);
        Holder.changeNewFromTrueToFalse(userId, (err)=>{
            if (err){
                console.log('FAIL TO CHANGE THE "NEW" OF FRIENDSHOLD FROM TRUE TO FALSE WHOSE >>>', userId);
            }
        });
    });
}

function friendList(req, res, next){
    const userId = req.query.userId;
    if (!userId){
        err.code = 401;
        return next(err);
    }
    const endUser = req.query.endUser;
    const userCount = parseInt(req.query.userCount);
    User.getFriends(endUser, userId, userCount, (err, result)=>{
        if (err){
            err.code = 500;
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
    if (!userId){
        err.code = 401;
        return next(err);
    }
    if (!profileUserId){
        err.code = 400;
        return next(err);
    }
    User.getProfile(profileUserId, userId, (err, result)=>{
        if (err){
            err.code = 500;
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
    if (!userId){
        err.code = 401;
        return next(err);
    }
    User.getMyProfile(userId, (err,result)=>{
        if (err){
            err.code = 500;
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
    const userId = req.query.userId;
    if (!userId){
        err.code = 401;
        return next(err);
    }
    const nickname = req.body.nickname;
    const userAddress = {
        area1 : req.body.area1,
        area2 : req.body.area2,
        area3 : req.body.area3,
        area4 : req.body.area4,
        area5 : req.body.area5
    };
    const age = req.body.babyAge;
    const coverImg = req.body.coverImg;
    const profileImg = req.body.profileImg;
    var query = {};
    var prevImageUrl = {};
    var queryForPost = {};
    var shouldBeDeletedList = [];
    async.parallel([
        function(cb){
            User.getImageUrl('coverImg profileImg profileThumbnail', userId ,(err, previousImageUrl)=>{
                if (err){
                    console.log('FAIL TO GET THE PERSONAL IMAGE URL OF', userId);
                }
                if (previousImageUrl){
                    prevImageUrl = previousImageUrl;
                }
                cb();
            });
        },
        function(cb){
            if (coverImg && coverImg.size > 0){
                shouldBeDeletedList.push('coverImg');
                s3upload.original(coverImg.path, coverImg.type, 'coverImg', userId, (err, imageUrl)=>{
                    if (err){
                        return cb(err);
                    }
                    if (!imageUrl){
                        cb();
                    } else { 
                        query.coverImg = imageUrl;
                        cb();
                    }
                });
            } else if (coverImg) {
                cb();
            } else {
                shouldBeDeletedList.push('coverImg');
                query.coverImg = "http://s3.ap-northeast-2.amazonaws.com/moundary/coverImg/emptyCoverImage.jpg";
                cb();
            }
        },
        function(cb){
            if (profileImg && profileImg.size > 0){
                shouldBeDeletedList = shouldBeDeletedList.concat(['profileImg','profileThumbnail']);
                if (profileImg.size < 339 ){
                    async.parallel([
                        function(s3cb){
                            s3upload.original(profileImg.path, profileImg.type, 'profileImg', userId, s3cb);
                        },
                        function(s3cb){
                            s3upload.original(profileImg.path, profileImg.type, 'profileThumbnail', userId, s3cb);
                        }
                    ], (err, urls)=>{
                        if (err){
                            return cb(err);
                        }
                        query.profileImg = urls[0];
                        query.profileThumbnail = urls[1];
                        queryForPost.profileThumbnail = urls[1];
                        cb();
                    });
                } else {
                    s3upload.originalAndThumbnail(profileImg.path, profileImg.type, 'profileImg', userId, (err, profileImageUrl, profileThumbnail)=>{
                        if (err){
                            return cb(err);
                        }
                        query.profileImg = profileImageUrl;
                        query.profileThumbnail = profileThumbnail;
                        queryForPost.profileThumbnail = profileThumbnail;
                        cb();
                    });
                }
            } else if ( profileImg ){
                cb();
            } else {
                shouldBeDeletedList = shouldBeDeletedList.concat(['profileImg','profileThumbnail']);
                query.profileImg = "http://s3.ap-northeast-2.amazonaws.com/moundary/profileImg/emptyProfileImage.jpg";
                query.profileThumbnail = "http://s3.ap-northeast-2.amazonaws.com/moundary/profileThumbnail/emptyProfileImage.jpg";
                queryForPost.profileThumbnail = "http://s3.ap-northeast-2.amazonaws.com/moundary/profileThumbnail/emptyProfileImage.jpg";
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
            thumbnailPath = __dirname+'/../upload/thumb_'+pathUtil.basename(profileImg.path);
            s3upload.delete(thumbnailPath, (err, result)=>{
                if (err){
                    console.log('FAIL TO DELETE THE IMAGE IN S3 >>>', thumbnailPath);
                }
            });
        } else {
            if (nickname){
                query.nickname = nickname;
                queryForPost.nickname = nickname;
            }
            if (userAddress.area1 || userAddress.area2 || userAddress.area3 || userAddress.area4 || userAddress.area5){
                for(var key in userAddress){
                    query['userAddress.'+key] = userAddress[key];
                }
            }
            if (age){
                var babyAge = new Date();
                babyAge.setFullYear(parseInt(age.substring(0,4)));
                babyAge.setMonth(parseInt(age.substring(4,6))-1);
                babyAge.setDate(parseInt(age.substring(6,8)));
                query.babyAge = babyAge;
            }
            User.updateUser(userId, query, (err, updatedUser)=>{
                if (err){
                    err.code = 500;
                    next(err);
                } else {
                    Post.updatePostUserInfo(userId, queryForPost, (err)=>{
                        if (err){
                            err.code = 500;
                            next(err);
                        } else {
                            const data = {
                                msg : 'success',
                                data : updatedUser
                            }
                            res.json(data);
                            console.log('shouldBeDeletedList >>>', shouldBeDeletedList);
                            async.each(shouldBeDeletedList, (ele, deleteCb)=>{
                                s3upload.delete(prevImageUrl[ele], (err, result)=>{
                                    if (err){
                                        console.log('FAILT TO DELETE THE IMAGE IN S3 >>>', prevImageUrl[ele]);
                                    }
                                    deleteCb();
                                });
                            });
                        }
                    });
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

// function modifyProfile(req, res, next){
//     const now = new Date();
//     const userId = req.query.userId;
//     var query; // 수정할 정보를 담을 query

//     const response = function(err, result){
//         if (err){
//             console.log('FATL TO MODIFY PROFILE OF >>>', userId);
//             return next(err);
//         }
//         const data = {
//             msg : 'success',
//             data : result[result.length-1]
//         }
//         res.json(data);
//     }
//     async.series([
//         function(cb){
//             // 닉네임 수정
//             const nickname = req.body.nickname;
//             if (nickname){
//                 query = {
//                     nickname : nickname
//                 }
//                 User.updateUser(userId, query, (err, updatedUser)=>{
//                     if (err){
//                         return cb(err);
//                     }
//                     Post.updatePostUserInfo(userId, query, (err)=>{
//                         if (err){
//                             return cb(err);
//                         }
//                         cb(null, updatedUser);
//                     });
//                 });
//             } else {
//                 cb(null, null);
//             }
//         },
//         function(cb){
//             // 주소 수정
//             const address = {
//                 area1 : req.body.area1,
//                 area2 : req.body.area2,
//                 area3 : req.body.area3,
//                 area4 : req.body.area4,
//                 area5 : req.body.area5
//             }
//             if ( address.area1 || address.area2 || address.area3 || address.area4 || address.area5 ){
//                     query = {
//                         userAddress : address
//                     }
//                     User.updateUser(userId, query, cb);
//             } else {
//                 cb(null, null);
//             }
//         },
//         function(cb){
//             // 아이 생년월일 수정
//             const babyId = req.body.babyId;
//             const age = req.body.babyAge;
//             if (babyId && age){
//                 var babyAge = new Date();
//                 babyAge.setFullYear(parseInt(age.substring(0,4)));
//                 babyAge.setMonth(parseInt(age.substring(4,6))-1);
//                 babyAge.setDate(parseInt(age.substring(6,8)));
//                 User.updateBabyAge(userId, babyId, babyAge, cb);
//             } else {
//                 cb(null, null);
//             }
//         },
//         function(cb){
//             // 아이 추가
//             const addBaby = req.body.addBaby;
//             console.log('USER WANT TO ADD A BIRTHDAY >>>', addBaby);
//             if (addBaby){
//                 var babyAge = new Date();
//                 babyAge.setFullYear(parseInt(addBaby.substring(0,4)));
//                 babyAge.setMonth(parseInt(addBaby.substring(4,6))-1);
//                 babyAge.setDate(parseInt(addBaby.substring(6,8)));
//                 query = { $push : { baby : { babyAge : babyAge } } };
//                 User.updateUser(userId, query, cb);
//             } else {
//                 cb(null, null);
//             }
//         },
//         function(cb){
//             //커버사진 수정
//             const coverImg = req.body.coverImg;
//             // s3upload.original(coverImg.path, coverImg.type, 'coverImg', userId, callback(imageUrl))
//             // User.getImageUrl('coverImg', userId, callback(err,imageUrl))
//             // User.updateUser(userId,query,callback(err,updatedUser))
//             // s3upload.delete(url, callback(err, result))
//             // fs.unlink(coverImg.path, callback(err))
//             User.getImageUrl('coverImg', userId, (err, prevImageUrl)=>{
//                 if (err){
//                     return cb(err);
//                 }
//                 if ( coverImg.size > 0 ){ // new image, should be update coverImg of user
//                     s3upload.original(coverImg.path, coverImg.type, 'coverImg', userId, (err, imageUrl)=>{ // should be delete a temporary file in the upload folder
//                         if (err){
//                             return cb(err, null);
//                         }
//                         query = {
//                             coverImg : imageUrl
//                         }
//                         User.updateUser(userId, query, (err, updatedUser)=>{ //return updated user profile information
//                             if (err){
//                                 return cb(err);
//                             }
//                             cb(null, updatedUser);
//                             if (prevImageUrl.coverImg){ // if there is a original image in db then should be deleted in s3, else, not need to delete the image in s3
//                                 // originally has a image, delete original image url at s3 and return updated prfile
//                                 s3upload.delete(prevImageUrl.coverImg, (err, result)=>{
//                                     if (err){
//                                         console.log('FAIL TO DELETE ORIGINAL COVER IMAGE IN S3 >>>', prevImageUrl.coverImg);
//                                     }
//                                 });
//                             }
//                         });
//                         fs.stat(coverImg.path, (err, stats)=>{
//                             if (err){
//                                 console.log('THERE IS NO TEMPORARY FILE >>>', coverImg.path);
//                             } else {
//                                 fs.unlink(coverImg.path, (err)=>{
//                                     if (err){
//                                         console.log('FAIL TO DELETE THE IMAGE >>>', coverImg.path);
//                                     }
//                                 });
//                             }
//                         });

//                     });
//                 } else if ( coverImg ) {
//                     User.getMyProfile(userId, cb);
//                 } else { // delete image
//                     if (prevImageUrl.coverImg){
//                         // originally has a image, just update at db, delete at s3 and return updated profile
//                         query = {
//                             coverImg : "http://s3.ap-northeast-2.amazonaws.com/moundary/coverImg/emptyCoverImage.jpg"
//                         }
//                         User.updateUser(userId, query, cb);
//                         s3upload.delete(prevImageUrl.coverImg, (err, result)=>{
//                             if (err){
//                                 console.log('FAIL TO DELETE THE IMAGE IN S3 >>>', prevImageUrl.coverImg);
//                             }
//                         });
//                     } else {
//                         //originally has no image, nothing to happen and just return his or her profile
//                         User.getMyProfile(userId, cb);
//                     }
//                 }
//             });
//         },
//         function(cb){
//             //프로필 수정
//             const profileImg = req.body.profileImg;
//             // s3upload.original(profileImg.path, profileImg.type, 'profileImg', userId, callback(imageUrl))
//             // User.getImageUrl('profileImg', userId, callback(err,imageUrl))
//             // User.updateUser(userId,query,callback(err,updatedUser))
//             // s3upload.delete(url, callback(err, result))
//             // fs.unlink(profileImg.path, callback(err))
//             // s3upload.thumbnail(profilePath, profileImg.type, 'profileThumbnail', userId, callback(err, thumbnailUrl))
//             // Post.updatePostUserInfo(userId, queryForPost, callback(err, results))

//             User.getImageUrl('profileImg profileThumbnail', userId, (err, prevImageUrl)=>{
//                 if (profileImg.size > 0){ // new image
//                     async.parallel([
//                         function(callback){
//                             s3upload.original(profileImg.path, profileImg.type, 'profileImg', userId, callback);
//                         },
//                         function(callback){
//                             s3upload.thumbnail(profileImg.path, profileImg.type, 'profileThumbnail', userId, callback);
//                         }
//                     ], (err, imageUrls)=>{
//                         if (err){
//                             // 두 업로드 중 하나가 에러발생 => 업로드 된 url 삭제
//                             s3upload.delete(imageUrls[0], (err, result)=>{
//                                 if (err){
//                                     console.log('ERROR OCCUR ON UPLOADING PROFILE THUMBNAIL >>>', imageUrls[1]);
//                                 }
//                             });
//                             s3upload.delete(imageUrls[1], (err, result)=>{
//                                 if (err){
//                                     console.log('ERROR OCCUR ON UPLOADING PROFILE THUMBNAIL >>>', imageUrls[0]);
//                                 }
//                             });
//                             return cb(err);
//                         }
//                         query = {
//                             profileImg : imageUrls[0],
//                             profileThumbnail : imageUrls[1]
//                         }
//                         User.updateUser(userId, query, (err, updatedUser)=>{
//                             const queryForPost = {
//                                 profileThumbnail : imageUrls[1]
//                             }
//                             Post.updatePostUserInfo(userId, queryForPost, (err)=>{
//                                 if (err){
//                                     // user model에서 업데이트된 거 원래 것으로 복구
//                                     // 업로드 된 url 삭제
//                                     query = {
//                                         profileImg : prevImageUrl.profileImg,
//                                         profileThumbnail : prevImageUrl.profileThumbnail
//                                     }
//                                     User.updateUser(userId, query, (err, results)=>{
//                                         if (err){
//                                             console.log('FAIL TO REPAIR USER INFORMATION, SHOULD BE >>>', query);
//                                         }
//                                     });
//                                     s3upload.delete(imageUrls[0], (err, result)=>{
//                                         if (err){
//                                             console.log('ERROR OCCUR ON UPLOADING PROFILE THUMBNAIL >>>', imageUrls[1]);
//                                         }
//                                     });
//                                     s3upload.delete(imageUrls[1], (err, result)=>{
//                                         if (err){
//                                             console.log('ERROR OCCUR ON UPLOADING PROFILE THUMBNAIL >>>', imageUrls[0]);
//                                         }
//                                     });
//                                     return cb(err);
//                                 }
//                                 cb(null, updatedUser);
//                                 if ( prevImageUrl.profileImg || prevImageUrl.profileThumbnail ){ //originally has a image, update at db, delete at s3 and return updated profile
//                                     s3upload.delete(prevImageUrl.profileImg, (err, result)=>{
//                                         if (err){
//                                             console.log('FAIL TO DELETE A PROFILEIMG >>>', prevImageUrl.profileImg);
//                                         }
//                                     });
//                                     s3upload.delete(prevImageUrl.profileThumbnail, (err, result)=>{
//                                         if (err){
//                                             console.log('FAIL TO DELETE A PROFILETHUMBNAIL >>>', prevImageUrl.profileThumbnail);
//                                         }
//                                     });
//                                 }
//                             });
//                         });
//                         fs.stat(profileImg.path, (err, stats)=>{
//                             if (err){
//                                 console.log('THERE IS NO TEMPORARY FILE >>>', profileImg.path);
//                             } else {
//                                 fs.unlink(profileImg.path, (err)=>{
//                                     if (err){
//                                         console.log('Fail to delete a temporary file >>>', profilePath);
//                                     }
//                                 }); 
//                             }
//                         });
//                         const thumbnailPath = __dirname+'/../upload/thumb_'+pathUtil.basename(profileImg.path);
//                         fs.stat(thumbnailPath, (err, stats)=>{
//                             if (err){
//                                 console.log('THERE IS NO TEMPORARY FILE >>>', thumbnailPath);
//                             } else {
//                                 fs.unlink(thumbnailPath, (err)=>{
//                                     if (err){
//                                         console.log('Fail to delete a temporary file >>>', thumbnailPath);
//                                     }
//                                 }); 
//                             }
//                         });
//                     });
//                 } else if (profileImg){
//                     USer.getMyProfile(userId, cb);
//                 } else { // delete image
//                     if ( prevImageUrl.profileImg || prevImageUrl.profileThumbnail ){
//                         //originallly has a image, just update at db, delete at s3 and return updated profile
//                         query = {
//                             profileImg : "http://s3.ap-northeast-2.amazonaws.com/moundary/profileImg/emptyProfileImage.jpg",
//                             profileThumbnail : "http://s3.ap-northeast-2.amazonaws.com/moundary/profileThumbnail/emptyProfileImage.jpg"
//                         }
//                         User.updateUser(userId, query, (err, updateUser)=>{
//                             if (err){
//                                 return cb(err);
//                             }
//                             cb(null, updateUser);
//                             s3upload.delete(prevImageUrl.profileImg, (err, result)=>{
//                                 if (err){
//                                     console.log('FAIL TO DELETE A PROFILEIMG >>>', prevImageUrl.profileImg);
//                                 }
//                             });
//                             s3upload.delete(prevImageUrl.profileThumbnail, (err, result)=>{
//                                 if (err){
//                                     console.log('FAIL TO DELETE A PROFILETHUMBNAIL >>>', prevImageUrl.profileThumbnail);
//                                 }
//                             });
//                         });
//                     } else {
//                         // originally has no image, nothing to happen and just return his or her profile
//                         User.getMyProfile(userId, cb);
//                     }
//                 }
//             });
//         }
//     ], response);
// }


function userList(req, res, next){
    const userId = req.query.userId;
    if (!userId){
        err.code = 401;
        return next(err);
    }
    const address = {
        area1 : req.query.area1,
        area2 : req.query.area2,
        area3 : req.query.area3,
        area4 : req.query.area4,
        area5 : req.query.area5
    }
    const ageRange = parseInt(req.query.ageRange);
    const endUser = req.query.endUser;
    const userCount = parseInt(req.query.userCount);

    const cb = function(err, result){
        if (err){
            err.code = 500;
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
    if (!userId){
        err.code = 401;
        return next(err);
    }
    if (!oppositeUserId){
        err.code = 400;
        return next(err);
    }
    log('1');
    const cb = function(err, result){
        if (err){
            err.code = 500;
            return next(err);
        }
        log('2');
        res.json( { msg : 'success' } );
    }
    log('3');
    switch(req.params.request){
        case 'apply': // 친구 신청
        log('4');
        Holder.apply(userId, oppositeUserId, (err, result)=>{
            if (err){
                return cb(err, null);
            }
            cb(null, result);
            User.getMyProfile(userId, (err, profile)=>{
                if (err){
                    return console.log('FAIL TO GET PROFILE OF >>>', userId);
                }
                const pushData = {
                    pushType : 2,
                    postId : null,
                    category : null,
                    pusherId : userId,
                    pusherNickname : profile.nickname,
                    img : profile.profileThumbnail,
                    content : null
                }
                User.getToken(oppositeUserId, (err, token)=>{
                    if (err){
                        return console.log('FAIL TO GET FCM TOKEN OF >>>', oppositeUserId);
                    }
                    fcmPush([token], pushData, (err, response)=>{
                        if (err){
                            console.log('FAIL TO PUSH >>>', err);
                        }
                        console.log('PUSH COMPLETE >>>', response)
                    });
                });
            });
        });
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