const mongoose = require('mongoose');
const async = require('async');
// const url = 'mongodb://52.78.98.25:27017/moundary';
// mongoose.connect(url);
var db = mongoose.connection;
const holderSchema = require('./Schema.js').holder;
const userSchema = require('./Schema.js').user;
const holder = mongoose.model('hold', holderSchema);
const user = mongoose.model('user', userSchema);

class Holder{}


// 친구 신청, [userId=>requestUser], [oppositeUserId=>responseUser]
Holder.apply = function(userId, oppositeUserId, callback){
    holder.create({
        requestUserId : userId,
        responseUserId : oppositeUserId
    }, (err, result)=>{
        if (err){
            return callback(err, null);
        }
        callback(null, result);
    });
}

// 친구 신청취소
Holder.cancel = function(userId, oppositeUserId, callback){
    holder.remove({
        requestUserId : userId,
        responseUserId : oppositeUserId
    }, (err, result)=>{
        if (err){
            return callback(err, null);
        }
        callback(null, result);
    })
}

//친구 수락
Holder.allow = function(userId, oppositeUserId, callback){
    var error;
    holder.remove({
        requestUserId : userId,
        responseUserId : oppositeUserId
    }, (err, result)=>{
        if (err){
            error = 'failToRemove';
            console.log('FAIL TO REMOVE RELATION BETWEEN %s AND %s FROM THE holds COLLECTION', userId, oppositeUserId);
        }
        async.parallel([
            function(cb){
                user.update({_id:userId},{$push:{friendList:oppositeUserId}}, cb);
            },
            function(cb){
                user.update({_id:oppositeUserId},{$push:{friendList : userId}}, cb);
            }
        ], (err, result)=>{
            if (err){
                var errHandlers = [
                    function(cb){
                        user.update({_id:userId}, {$pull:{friendList:oppositeUserId}}, cb);
                    },
                    function(cb){
                        user.update({_id:oppositeUserId}, {$pull:{friendList:userId}}, cb);
                    }
                ]
                if (error == 'failToRemove'){
                    errHandlers.push(
                        function(cb){
                            holder.create({
                                requestUserId : userId,
                                responseUserId : oppositeUserId
                            }, cb);
                        }
                    )
                }
                async.parallel(errHandlers, (err, result)=>{
                    if (err){
                        console.log('FAIL TO DISPOSE OF A NEW RELATION BETWEEN %s AND %s', userId, oppositeUserId);
                    }
                    console.log('FAIL TO UPDATE NEW FRINED OF %s AND %s', userId, oppositeUserId);
                    return callback(err, null);
                });
            }
            callback(null, result);
        });
    })
}

// 친구 거절
Holder.reject = function(userId, oppositeUserId, callback){
    holder.remove({
        requestUserId : oppositeUserId,  // 친구 신청 취소와 반대
        responseUserId : userId
    }, (err, result)=>{
        if (err){
            return callback(err, null);
        }
        callback(null, result);
    })
}

// 친구 삭제
Holder.delete = function(userId, oppositeUserId, callback){
    
}

module.exports = Holder;