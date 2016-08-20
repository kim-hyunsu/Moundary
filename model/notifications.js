const mongoose = require('mongoose');

var db = mongoose.connection();
const notificationSchema = require('./Schema.js').notification;
const userSchema = require('./Schema.js').user;
const postSchema = require('./Schema.js').post;
var notification = mongoose.model('notification', notificationSchema);
var post = mongoose.model('post', userSchema);
var user = mongoose.model('user', postSchema);


class Notification{};

Notification.addPush = function(pushData, callback){
    if (pushData.pushType == 2){
        // pusherNickname이랑 img(pusherThumbnail)추가해서 notification에 create
    }
    post.aggregate()
        .match({_id : pushData.postId})
        .lookup({from : 'users', localField : 'userId', foreignField : '_id', as : 'puller'})
        .match({'puller._id' : {$ne : pushData.pusherId}})
        .project({puller: 1, _id:0})
        .then((docs)=>{
            if (docs.length == 0){
                return callback(err, null);
            }
            callback(null, docs[0].puller.fcmToken);
            pushData.pullerId = docs[0].puller._id;
            notification.create(pushData, (err, result)=>{
                if (err){
                    callback(err, null);
                }
            });
        }, (err)=>{
            callback(err, null);
        });
}

Notification.addPushs = function(pushData, postAddress, callback){
    delete postAddress.area5;
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
                if (err){
                    callback(err, null);
                }
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