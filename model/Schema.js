const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = mongoose.Schema({
    postId : Schema.Types.ObjectId,
    category : Number,
    postAddress : {
        area1: String,
        area2: String,
        area3: String,
        area4: String,
        area5: String
    },
    due : Date,
    userId : Schema.Types.ObjectId,
    postImg : String,
    postThumbnail : String,
    postContent : String,
    postDate : Date,
    postLikeUsers : [Schema.Types.ObjectId],
    reply : [{
        replyId : Schema.Types.ObjectId,
        userId : Schema.Types.ObjectId,
        replyContent : String,
        replyDate : Date,
        replyLikeUsers : [Schema.Types.ObjectId]
    }]
});

module.exports.post = postSchema;

const userSchema = mongoose.Schema({
    userId : Schema.Types.ObjectId,
    policyAgreeDate : Date,
    personalInfoAgreeDate : Date,
    profileImg : String,
    profileThumbnail : String,
    coverImg : String,
    userAdress : {
        area1 : String,
        area2 : String,
        area3 : String,
        area4 : String,
        area5 : String
    },
    joinPath : Number,
    interest : {
        sale : Boolean,
        store : Boolean,
        event : Boolean,
        share : Boolean
    },
    friendList : [Schema.Types.ObjectId],
    babyInfo : [Number],
    alram : {
        moundaryAlarm : Boolean,
        replyAlarm : Boolean,
        likeAlarm : Boolean,
        alarmVibration : Boolean
    }
});

module.exports.user = userSchema;

const holderSchema =  mongoose.Schema({
    _id : Schema.Types.ObjectId,
    requestUserId : Schema.Types.ObjectId,
    responseUserId : Schema.Types.ObjectId,
    requestDate : Date
});

module.exports.holder = holderSchema;
