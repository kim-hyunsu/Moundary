const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = Schema({
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
    nickname : String,
    postImg : String,
    postThumbnail : String,
    postContent : String,
    postDate : Date,
    postLikeUsers : [Schema.Types.ObjectId],
    replyCount : Number,
    reply : [{
        userId : Schema.Types.ObjectId,
        profileThumbnail : String,
        nickname : String,  
        replyContent : String,
        replyDate : Date,
        replyLikeUsers : [Schema.Types.ObjectId] 
    }]
});

module.exports.post = postSchema;

const userSchema = Schema({
    userId : Schema.Types.ObjectId,
    policyAgreeDate : Date,
    personalInfoAgreeDate : Date,
    profileImg : String,
    profileThumbnail : String,
    coverImg : String,
    nickname : String,
    userEmail : String,
    userAdress : {
        area1 : String,
        area2 : String,
        area3 : String,
        area4 : String,
        area5 : String
    },
    joinPath : Number,
    friendList : [Schema.Types.ObjectId],
    baby : [{
        babyAge: Date
    }],
    alram : {
        mode : Number,
        sale : Boolean,
        store : Boolean,
        event : Boolean,
        share : Boolean,
        moundary : Boolean,
        reply : Boolean,
        like : Boolean
    }
});

module.exports.user = userSchema;

const holderSchema =  Schema({
    _id : Schema.Types.ObjectId,
    requestUserId : Schema.Types.ObjectId,
    responseUserId : Schema.Types.ObjectId,
    requestDate : Date
});

module.exports.holder = holderSchema;
