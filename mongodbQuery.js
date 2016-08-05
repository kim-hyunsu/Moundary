db.getCollection('posts').insert({
    category : 0,
    userId : ObjectId("57a43d4a8f296686e960fbec"),
    nickname : '소영맘',
    profileImg : "https://s3.ap-northeast-2.amazonaws.com/moundary/postImg/201685154832_57a04ad314779f0c027a9b0c.jpg",
    postImg : "https://s3.ap-northeast-2.amazonaws.com/moundary/postImg/201685154832_57a04ad314779f0c027a9b0c.jpg",
    postContent : '테스트 posting1',
    postDate : new Date(),
    postLikeUsers : [ObjectId("57a04ad314779f0c027a9b0c"), ObjectId("579f640e0000000000000000")],
    replyCount : 0,
    reply : []
});

db.getCollection('users').insert({
    _id : ObjectId("57a43def8f296686e960fbed"),
    policyAgreeDate : new Date(),
    personalInfoAgreeDate : new Date(),
    profileImg : "https://s3.ap-northeast-2.amazonaws.com/moundary/postImg/201685154832_57a04ad314779f0c027a9b0c.jpg",
    coverImg : "https://s3.ap-northeast-2.amazonaws.com/moundary/postImg/201685154832_57a04ad314779f0c027a9b0c.jpg",
    nickname : "아현맘",
    userEmail : 'Email@email.co.kr',
    userAddress : {
        area1 : '충청남도',
        area2 : '천안시',
        area3 : '서북구',
        area4 : '두정동',
        area5 : '한성아파트'
    },
    joinPath : 1,
    interest : {
        sale : true,
        store : true,
        event : true,
        share : true
    },
    friendList : [ObjectId("57a04ad314779f0c027a9b0c"),ObjectId("57a43d4a8f296686e960fbec")],
    baby :[{
        babyAge : new Date()
    }],
    alarm : {
        moundaryAlarm : true,
        replyAlarm : true,
        likealarm : true,
        alarmVibration : true
    }
});

ObjectId("57a04ad314779f0c027a9b0c")
ObjectId("57a43d4a8f296686e960fbec")
ObjectId("57a43def8f296686e960fbed")