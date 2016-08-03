const mongoose = require('mongoose');
// const url = 'mongodb://52.78.98.25:27017/moundary';
// mongoose.connect(url);
var db = mongoose.connection;
const userSchema = require('./Schema.js').user;
const user = mongoose.model('user', userSchema);
class User{}

// 친구 수 얻기
User.getFriendCount = function(userId, callback){

}

// 친구 목록 얻기
User.getFriends = function(userId, callback){

}

// 유저 정보 얻기
User.getInfo = function(userId, callback){

} 

// 프로필사진url과 이메일주소 저장 => callback으로 userId 전달
User.createUser = function(userInfo, callback){
    
}

// userInfo에 객체로 유저 정보를 입력하면 해당 정보 저장
User.updateUser = function(userId, userInfo, callback){

}

module.exports = User;