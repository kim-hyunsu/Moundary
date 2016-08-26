const mongoose = require('mongoose');
const async = require('async');
var db = mongoose.connection;
const notificationSchema = require('./Schema.js').notification;
const userSchema = require('./Schema.js').user;
const postSchema = require('./Schema.js').post;
var notification = mongoose.model('notification', notificationSchema);
var post = mongoose.model('post', postSchema);
var user = mongoose.model('user', userSchema);


class Notification{};

Notification.addReplyPush = function(pushData, callback){
    post.aggregate()
        .match({_id : mongoose.Types.ObjectId(pushData.postId)})
        .lookup({from : 'users', localField : 'userId', foreignField : '_id', as : 'puller'})
        .match({'puller._id' : {$ne : mongoose.Types.ObjectId(pushData.pusherId)}})
        .project({puller: 1, _id:0})
        .then((docs)=>{
            console.log('docs>>>', docs[0].puller[0]);
            if (docs.length == 0){
                return callback(err, null);
            }
            if (pushData.pusherId == docs[0].puller[0]._id){
                return callback(err, null);
            }
            callback(null, docs[0].puller[0].fcmToken);
            pushData.pullerId = docs[0].puller[0]._id;
            notification.create(pushData, (err, result)=>{
                if (err){
                    console.log('FAIL TO SAVE A PUSH >>>', pushData);
                }
            });
        }, (err)=>{
            callback(err, null);
        });
}

Notification.addLikePush = function(pushData, callback){
    async.parallel({
        token : function(cb){
            user.findOne({_id : pushData.pullerId}, 'fcmToken')
                .then((doc)=>{
                    cb(null, doc.fcmToken);
                }, (err)=>{
                    callback(err, null);
                });
        },
        pushData : function(cb){
            user.findOne({_id : pushData.pusherId}, 'nickname profileThumbnail')
                .then((doc)=>{
                    pushData.pusherNickname = doc.nickname;
                    pushData.img = doc.profileThumbnail;
                    cb(null, pushData);
                    notification.create(pushData, (err, result)=>{
                        if (err){
                            console.log('FAIL TO SAVE A PUSH >>>', pushData);
                        }
                        
                    });
                }, (err)=>{
                    if (err){
                        console.log('NOT FOUND PUSHER ID >>>', pushData.pusherId);
                    }
                    cb(null,null);
                });
        }
    }, (err, result)=>{
        if (err){
            return callback(err, null, null);
        }
        callback(null, result.token, result.pushData);
    });


}

Notification.addInfoPushs = function(pushData, postAddress, callback){
    delete postAddress.area5;
    delete postAddress.area3;
    var query = {};
    for(var key in postAddress){
        query['userAddress.'+key] = postAddress[key];
    }
    query._id = { $ne : pushData.pusherId};
    var tokens = [];
    user.find(query, 'fcmToken', (err, docs)=>{
        if (err){
            return callback(err, null);
        }
        async.each(docs, (ele, cb)=>{
            tokens.push(ele.fcmToken);
            pushData.pullerId = ele._id;
            notification.create(pushData, (err, result)=>{
                cb();
            });
        }, (err)=>{
            if (err){
                callback(err, null);
            }
            callback(null, tokens);
        });
    });
}

Notification.getNotifications = function(userId, callback){
    const now = new Date();
    const nowMilli = new Date(0);
    var projection1 = {
        pushType : 1,
        postId : 1,
        category : 1,
        pusherId : 1,
        pullerId : 1,
        pusherNickname : 1,
        img : 1,
        content : 1,
        pushDate : 1,
        year : {$substr : ['$pushDate',0,4]},
        month : {$substr : ['$pushDate',5,2]},
        day : {$substr : ['$pushDate', 8,2]},
        parsedDate : {$add : [{$subtract: [now, '$pushDate']}, nowMilli]},
        confirmed :1
    }
    const format = { $cond : [
        {$ne : ['$$year', 1970]},
        {$concat : ['$year','.','$month','.', '$day']},
        {$cond : [
            {$ne : ['$$month',1]},
            {$concat : ['$year','.','$month','.', '$day']},
            {$cond : [
                {$ne : ['$$day', 1]},
                {$concat : ['약 ',{$substr : ['$$day', 0 ,-1]}, '일 전']},
                {$cond : [
                    '$$hours',
                    {$concat : ['약 ',{$substr : ['$$hours', 0, -1]}, '시간 전']},
                    {$cond : [
                        '$$minutes',
                        {$concat : ['약 ', {$substr : ['$$minutes', 0, -1]}, '분 전']},
                        {$cond : [
                            '$$seconds',
                            {$concat : ['약 ', {$substr : ['$$seconds', 0, -1]}, '초 전']},
                            '몇 초 전'
                        ]}
                    ]}
                ]}
            ]}
        ]}
    ]}
    var projection2 = {
        pushType : 1,
        postId : 1,
        category : 1,
        pusherId : 1,
        pullerId : 1,
        pusherNickname : 1,
        img : 1,
        content : 1,
        pushDate : {
            $let : {
                vars : {
                    year : {$year : '$parsedDate'},
                    month : {$month : '$parsedDate'},
                    day : {$dayOfMonth : '$parsedDate'},
                    hours : {$hour : '$parsedDate'},
                    minutes : {$minute : '$parsedDate'},
                    seconds:  {$second : '$parsedDate'}
                },
                in : format
            }
        },
        confirmed :1
    }
    notification.aggregate()
        .match({pullerId : mongoose.Types.ObjectId(userId)})
        .project(projection1).project(projection2)
        .then((result)=>{
            callback(null, result);
        }, (err)=>{
            callback(null, err);
        });
}

Notification.confirmAlteration = function(userId, postId, callback){
    notification.update({postId : postId, pullerId : userId}, {confirmed : true}, {multi : true}, (err, result)=>{
        if (err){
            callback(err);
        }
    });
}

Notification.deleteOldNotifications = function(callback){
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(now.getDate()-3);
    notification.remove({pushDate: {$lt : threeDaysAgo}}, (err, result)=>{
        if (err){
            callback(err, null);
        }
    });
}

module.exports = Notification;