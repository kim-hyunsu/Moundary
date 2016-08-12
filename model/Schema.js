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
    userId : {type : Schema.Types.ObjectId, ref : 'user'}, 
    nickname : { type : String, ref : 'user'},
    profileThumbnail : { type : String, ref : 'user'},
    postImg : String,
    postThumbnail : String,
    postContent : String,
    postDate : { type : Date, default : Date.now}, //default>>> now
    postLikeUsers : [Schema.Types.ObjectId],
    replyCount : { type : Number, default : 0}, //default
    reply : [{
        userId : Schema.Types.ObjectId,
        profileThumbnail : String,
        nickname : String,  
        replyContent : String,
        replyDate : { type : Date, default : Date.now},
        replyLikeUsers : [Schema.Types.ObjectId] 
    }]
});

module.exports.post = postSchema;

const userSchema = Schema({
    userId : Schema.Types.ObjectId,
    policyAgreeDate : { type : Date, default : Date.now},
    personalInfoAgreeDate : { type : Date, default : Date.now },
    profileImg : String,
    profileThumbnail : String,
    coverImg : String,
    nickname : String,
    userEmail : String,
    userAddress : {
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
        mode : {type : Number, default : 1},
        sale : { type : Boolean, default : false},
        store : { type : Boolean, default : false},
        event : { type : Boolean, default : false},
        share : { type : Boolean, default : false},
        moundary : { type : Boolean, default : true},
        reply : { type : Boolean, default : true},
        like : { type : Boolean, default : true}
    }
});

module.exports.user = userSchema;

const holderSchema =  Schema({
    requestUserId : { type : Schema.Types.ObjectId, ref : 'user'},
    responseUserId : {type : Schema.Types.ObjectId, ref : 'user'},
    requestDate : {type : Date, default: Date.now}
});

module.exports.holder = holderSchema;
