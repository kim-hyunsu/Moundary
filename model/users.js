const async = require('async');
const mongoose = require('mongoose');
// const url = 'mongodb://52.78.98.25:27017/moundary';
// mongoose.connect(url);
var db = mongoose.connection;
const userSchema = require('./Schema.js').user;
const holderSchema = require('./Schema.js').holder;
const user = mongoose.model('user', userSchema);
const holder = mongoose.model('hold', holderSchema);
class User{}

// 친구 목록 얻기
User.getFriends = function(endUser, userId, count, callback){
    endUser = endUser || "ffce5eef0000000000000000";
    count = count || 60;
    user.findOne({_id : userId}, 'friendList -_id', (err, result)=>{
        if (err){
            return callback(err, null);
        }
        const friendList = result.friendList;
        user.find({_id:{$in:friendList}}, 'nickname profileThumbnail userAddress baby')
            .where('_id').lt(endUser).limit(count).sort({_id:-1})
            .then((results)=>{
                callback(null, results);
            }, (err)=>{
                callback(err, null);
            });
    });
}

// 유저 프로필 얻기
User.getProfile = function(profileUserId, userId, callback){
    user.findOne({_id: profileUserId}, 'profileImg coverImg nickname userAddress friendList').lean()
        .then((result)=>{
            if (result.friendList.indexOf(mongoose.Types.ObjectId(userId)) == -1){
                // 친구 신청 중인지 아닌지 확인
                console.log('NOT YET THE FRIEND');
                holder.where({requestUserId: userId, responseUserId : profileUserId}).count((err, count)=>{
                    if (err){
                        return callback(err, null);
                    }
                    else if (count==0){
                        console.log('NOT FRIEND');
                        //친구 요청 중도 아님=> 친구 아님
                        result.isFriend = -1;
                    }
                    else{
                        console.log('WAITING TO PERMIT FRIEND REQUEST');
                        // 친구 요청중
                        result.isFriend = 0;
                    }
                    delete result.friendList;
                    callback(null, result);
                });
                console.log('HOLDER SEARCHING COMPLETE');
            }
            else{
                console.log('ALREADY FRIEND');
                // 이미 친구, isFriend = 1
                result.isFriend = 1;
                delete result.friendList;
                callback(null, result);
            }
        }, (err)=>{
            callback(err, null);
        });
} 

// 나의 프로필 페이지
User.getMyProfile = function(userId, callback){
    user.findOne({_id: userId}, 'profileImg coverImg nickname userAddress friendList baby', (err, result)=>{
        if (err){
            return callback(err, null);
        }
        callback(null, result);
    });
}

// 프로필사진url과 이메일주소 저장 => callback으로 userId 전달
User.createUser = function(userInfo, callback){
    user.create(userInfo, (err, result)=>{
        if (err){
            callback(err, null);
        }
        callback(null, result);
    });
}

// userInfo에 객체로 유저 정보를 입력하면 해당 정보 저장
User.updateUser = function(userId, userInfo, callback){
    user.update({_id : userId}, userInfo, {upsert : true},(err, result)=>{
        if (err){
            return callback(err, null);
        }
        userInfo._id = result._id;
        callback(null, userInfo);
    });
}

// 아이 나이 수정
User.updateBabyAge = function(userId, babyId, babyAge, callback){
    user.update({_id : userId, 'baby._id' : babyId}, {$set : {'baby.$.babyAge' : babyAge}}, (err, result)=>{
        if (err){
            return callback(err, null);
        }
        const baby = {
            _id : babyId,
            babyAge : babyAge
        }
        callback(null, baby);
    });
    // 넘겨줄거 제대로 정하기
}

// ageRange 코드 값에 따라 알맞은 생년월일 범위 반환
function ageRangeSwitch(ageRange){
    var min = new Date();
    var max = new Date();
    switch(ageRange){
        case 1: // 0에서 3개월
        min.setMonth(min.getMonth()-4);
        case 2: // 4에서 12개월
        max.setMonth(max.getMonth()-4);
        min.setMonth(min.getMonth()-12);
        case 3: // 2에서 4세
        max.setMonth(max.getMonth()-12);
        min = new Date(min.getFullYear()-3, 0, 0, 0, 0, 0, 0);
        case 4: // 5에서 7세
        max = new Date(max.getFullYear()-3, 0, 0, 0, 0, 0, 0);
        min = new Date(min.getFullYear()-6, 0, 0, 0, 0, 0, 0);
        case 5: // 7세 이상
        max = new Date(max.getFullYear()-6, 0, 0, 0, 0, 0, 0);
        min = new Date(min.getFullYear()-19, 0, 0, 0, 0, 0, 0);
        default: // no ageRange input
        min = new Date(min.getFullYear()-19, 0, 0, 0, 0, 0, 0);
    }
    return min, max;
}

// 해당 주소에 있는 사용자들 불러오기
User.getUsersByAddress = function(endUser, userId, userAddress, ageRange, count, callback){
    //default values
    endUser = endUser || "ffce5eef0000000000000000";
    count = count || 60;

    user.findOne({_id:userId}, 'friendList -_id', (err, result)=>{
        if (err){
            return callback(err, null);
        }
        var min, max = ageRangeSwitch(ageRange);
        var query = {};
        for(var key in userAddress){
            query['userAddress.'+key] = userAddress[key];
        }
        user.find(query, 'profileThumbnail nickname userAddress baby')
            .where('baby.$.babyAge').gte(min).lte(max)
            .where('_id').nin(result.friendList)
            .limit(count).sort({_id:-1}).lean()
            .then( (results)=>{
                async.each(results, (ele, cb)=>{
                    holder.where({requestUserId : userId, responseUserId : ele._id}).count((err, count)=>{
                        if (count == 0){
                            ele.isRequestUser = false;
                        }
                        else{
                            ele.isRequestUser = true;
                        }
                        cb()
                    });
                }, (err)=>{
                    if (err){
                        return callback(err, null);
                    }
                    callback(null, results);
                });
            }, (err)=>{
                callback(err, null);
            });        
    });

}

// 사용자 주변 사용자들 불러오기
User.getUsersNearby = function(endUser, userId, ageRange, count, callback){
    //default values
    endUser = endUser || "ffce5eef0000000000000000"; // ObjectId of 2105.12.31 23:59:59   
    count = count || 60;

    user.findOne({_id : userId}, 'userAddress babyAge friendList -_id', (err, result)=>{
        if (err){
            return callback(err, null);
        }
        var min, max = ageRangeSwitch(ageRange);
        var query = {};
        var userAddress = result.userAddress;
        delete userAddress.area5;  //상세지역은 빼도 '동'까지만 검색
        for(var key in userAddress){
            query['userAddress.'+key] = userAddress[key];
        }
        user.find(query, 'profileThumbnail nickname userAddress baby')
            .where('baby.$.babyAge').gte(min).lte(max)
            .where('_id').nin(result.friendList)
            .limit(count).sort({_id:-1}).lean()
            .then( (results)=>{
                async.each(results, (ele, cb)=>{
                    holder.where({requestUserId : userId, responseUserId : ele._id}).count((err, count)=>{
                        if (count == 0){
                            ele.isRequestUser = false;
                        }
                        else{
                            ele.isRequestUser = true;
                        }
                        cb()
                    });
                }, (err)=>{
                    if (err){
                        return callback(err, null);
                    }
                    callback(null, results);
                });
            }, (err)=>{
                callback(err, null);
            });
    });
}

module.exports = User;