const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = Schema({
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
    postLikeCount : {type : Number, default : 0},
    replyCount : { type : Number, default : 0}, //default
    reply : [{
        userId : Schema.Types.ObjectId,
        profileThumbnail : String,
        nickname : String,  
        replyContent : String,
        replyDate : { type : Date, default : Date.now}
        //, replyLikeCount : {type : Number, default: 0},
        // replyLikeUsers : [Schema.Types.ObjectId] 
    }]
});

module.exports.post = postSchema;

const userSchema = Schema({
    uuid : String,
    fcmToken : String,
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
    babyAge : Date
    // alram : {
    //     alram : {type : Boolean, default : true},
    //     sale : { type : Boolean, default : false},
    //     store : { type : Boolean, default : false},
    //     event : { type : Boolean, default : false},
    //     share : { type : Boolean, default : false},
    //     moundary : { type : Boolean, default : true},
    //     reply : { type : Boolean, default : true},
    //     like : { type : Boolean, default : true}
    // }
});

module.exports.user = userSchema;

const holderSchema =  Schema({
    requestUserId : { type : Schema.Types.ObjectId, ref : 'user'},
    responseUserId : {type : Schema.Types.ObjectId, ref : 'user'},
    requestDate : {type : Date, default: Date.now}
});

module.exports.holder = holderSchema;

const notificationSchema = Schema({
    pushType : Number,
    postId : Schema.Types.ObjectId,
    pusherId : Schema.Types.ObjectId,
    pullerId : Schema.Types.ObjectId,
    pusherNickname : String,
    category : Number,
    content : String,
    img : String,
    pushDate : {type : Date, default : Date.now},
    confirmed : {type : Boolean, default : false}
});

module.exports.notification = notificationSchema;