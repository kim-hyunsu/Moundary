const mongoose = require('mongoose');
// const url = 'mongodb://52.78.98.25:27017/moundary';
// mongoose.connect(url);
var db = mongoose.connection;
const userSchema = require('./Schema.js').user;
const holderSchema = require('./Schema.js').holder;
const user = mongoose.model('user', userSchema);
const holder = mongoose.model('hold', holderSchema);
class User{}

// 친구 수 얻기
User.getFriendCount = function(userId, callback){

}

// 친구 목록 얻기
User.getFriends = function(userId, callback){

}

// 유저 프로필 얻기
User.getProfile = function(profileUserId, userId, callback){
    user.findOne({_id: profileUserId}, 'profileImg coverImg nickname userAddress friendList')
        .then((result)=>{
            if (result.friendList.indexOf(mongoose.Types.ObjectId(userId)) == -1){
                // 친구 신청 중인지 아닌지 확인
                holder.where({requestUserId: userId, responseUserId : profileUserId}).count((err, count)=>{
                    if (count==0){
                        //친구 요청 중도 아님=> 친구 아님
                        result.isFriend = -1;
                    }
                    else{
                        // 친구 요청중
                        result.isFriend = 0;
                    }
                });
            }
            else{
                // 이미 친구, isFriend = 1
                result.isFriend = 1;
            }
            delete result.friendList;
            callback(null, result);
        }, (err)=>{
            callback(err, null);
        });
} 

// 프로필 수정페이지에 아이 나이 띄워주기 위해 아이 나이만 가져오기
User.getBabyAge = function(userId, callback){
    user.findOne({_id: userId}, 'babyAge -_id', (err, result)=>{
        if (err){
            return callback(err, null);
        }
        callback(null, result.babyAge);
    });
}

// 프로필사진url과 이메일주소 저장 => callback으로 userId 전달
User.createUser = function(userInfo, callback){
    
}

// userInfo에 객체로 유저 정보를 입력하면 해당 정보 저장
User.updateUser = function(userId, userInfo, callback){
    user.update({_id : userId}, userInfo, {upsert : true},(err, result)=>{
        if (err){
            return callback(err, null);
        }
        callback(null, result);
    });
}

module.exports = User;