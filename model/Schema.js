const postSchema = mongoose.Schema({
    postId : mongoose.Types.ObjectId,
    category : Number,
    postAddress : {
        area1: String,
        area2: String,
        area3: String,
        area4: String,
        area5: String
    },
    due : Date,
    userId : mongoose.Types.ObjectId,
    postImg : String,
    postThumbnail : String,
    postContent : String,
    postDate : Date,
    postLikeUsers : [mongoose.Types.ObjectId],
    reply : [{
        replyId : mongoose.Types.ObjectId,
        userId : mongoose.Types.ObjectId,
        replyContent : String,
        replyDate : Date,
        replyLikeUsers : [mongoose.Types.ObjectId]
    }]
});

module.exports.post = postSchema;

const userSchema = mongoose.Schema({
    userId : mongoose.Types.ObjectId,
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
    friendList : [mongoose.Types.ObjectId],
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
    _id : mongoose.Types.ObjectId,
    requestUserId : mongoose.Types.ObjectId,
    responseUserId : mongoose.Types.ObjectId,
    requestDate : Date
});

module.exports.holder = holderSchema;
