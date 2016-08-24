const mongoose = require('mongoose');
const async = require('async');
// const url = 'mongodb://52.78.98.25:27017/moundary';
// mongoose.connect(url);
var db = mongoose.connection;
const holderSchema = require('./Schema.js').holder;
const userSchema = require('./Schema.js').user;
const holder = mongoose.model('hold', holderSchema);
const user = mongoose.model('user', userSchema);
const log =console.log;
class Holder{}


// 친구 신청, [userId=>requestUser], [oppositeUserId=>responseUser]
Holder.apply = function(userId, oppositeUserId, callback){
    log('5');
    holder.update({ // todo-같은 요청이 두번 올 때 겹치는 문제 고려
        requestUserId : userId, 
        responseUserId : oppositeUserId
    },{
        requestUserId : userId, 
        responseUserId : oppositeUserId,
        requestDate : new Date()
    }, {upsert :true },(err, result)=>{
        if (err){
            return callback(err, null);
        }
        log('6');
        callback(null, result);
    });
}

// 친구 신청취소
Holder.cancel = function(userId, oppositeUserId, callback){
    holder.remove({
        requestUserId : userId,
        responseUserId : oppositeUserId
    }, callback);
}

//친구 수락
Holder.allow = function(userId, oppositeUserId, callback){
    var error;
    holder.remove({
        requestUserId : oppositeUserId,
        responseUserId : userId
    }, (err, result)=>{
        // fail to remove
        if (err){
            error = 'failToRemove';
            console.log('FAIL TO REMOVE RELATION BETWEEN %s AND %s FROM THE holds COLLECTION', userId, oppositeUserId);
        }
        // success to remove
        async.parallel([
            function(cb){ // add oppositeUserId for friend
                user.update({_id:userId},{$push:{friendList:oppositeUserId}}, cb);
            },
            function(cb){ // add userId for friend
                user.update({_id:oppositeUserId},{$push:{friendList : userId}}, cb);
            }
        ], (err, result)=>{
            // At least one of addition failed, remove the addicted friend
            if (err){
                var errHandlers = [
                    function(cb){
                        user.update({_id:userId}, {$pull:{friendList:oppositeUserId}}, cb);
                    },
                    function(cb){
                        user.update({_id:oppositeUserId}, {$pull:{friendList:userId}}, cb);
                    }
                ]
                // in the case of failing to delete, repair to hold on the friendship between userId and oppositeUserId
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
                // excute the restorations above
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
    }, callback);
}

// 친구 삭제
Holder.delete = function(userId, oppositeUserId, callback){
    async.parallel([
        function(cb){
            user.update({_id : userId}, {$pull : {friendList : oppositeUserId}}, cb);
        },
        function(cb){
            user.update({_id : oppositeUserId}, {$pull : {friendList : userId}}, cb);
        }
    ], (err, result)=>{
        if (err){
            async.parallel([
                function(cb){
                    user.update({_id : userId}, {$push : {friendList : oppositeUserId}},{upsert : true}, cb);
                },
                function(cb){
                    user.update({_id : oppositeUserId}, {$push : {friendList : userId}}, {upsert : true}, cb);
                }
            ], (err , results)=>{
                if (err){
                    console.log('FAIL TO REPAIR A FRIENDSHIP BETWEEN %s AND %s', userId, oppositeUserId);
                }
                console.log('FAIL TO DELETE A FRIENDSHIP BETWEEN %s AND %s', userId, oppositeUserId);
                callback(err, null);
            });
        }
        callback(null, result);
    });
}

Holder.getFriendCandidates = function(userId, callback){
    user.aggregate()
        .lookup({from : 'holds', localField : '_id', foreignField : 'requestUserId', as : 'requestUser'})
        .unwind('requestUser')
        .match({'requestUser.responseUserId' : mongoose.Types.ObjectId(userId)})
        .project('nickname profileThumbnail')
        .then((result)=>{
            callback(null, result);
        }, (err)=>{
            callback(err, null);
        });
}

module.exports = Holder;