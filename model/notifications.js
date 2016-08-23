const mongoose = require('mongoose');

var db = mongoose.connection;
const notificationSchema = require('./Schema.js').notification;
const userSchema = require('./Schema.js').user;
const postSchema = require('./Schema.js').post;
var notification = mongoose.model('notification', notificationSchema);
var post = mongoose.model('post', postSchema);
var user = mongoose.model('user', userSchema);


class Notification{};

Notification.addPush = function(pushData, callback){
    post.aggregate()
        .match({_id : mongoose.Types.ObjectId(pushData.postId)})
        .lookup({from : 'users', localField : 'userId', foreignField : '_id', as : 'puller'})
        .match({'puller._id' : {$ne : mongoose.Types.ObjectId(pushData.pusherId)}})
        .project({puller: 1, _id:0})
        .then((docs)=>{
            if (docs.length == 0){
                return callback(err, null);
            }
            callback(null, docs[0].puller.fcmToken);
            pushData.pullerId = docs[0].puller._id;
            notification.create(pushData, (err, result)=>{
                if (err){
                    console.log('FAIL TO SAVE A PUSH >>>', pushData);
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

Notification.getNotifications = function(userId, callback){
    notification.find({pullerId : userId}, callback);
}

Notification.confirmAlteration = function(userId, postId, callback){
    notification.update({postId : postId, pullerId : userId}, {confirmed : true}, {multi : true}, (err, result)=>{
        if (err){
            callback(err);
        }
    });
}

Notification.deleteOldNotifications = function(callback){
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate()-7);
    notification.remove({pushDate: {$lt : oneWeekAgo}}, (err, result)=>{
        if (err){
            callback(err, null);
        }
    });
}

module.exports = Notification;