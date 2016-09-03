
// 게시글 가져오기 getPosts - version of aggregate
Post.getPosts = function(endPost, userId, count, callback){
    if (!endPost){
        endPost = "ffce5eef0000000000000000"; // ObjectId of 2105.12.31 23:59:59
    }
    user.findOne({_id : userId}, 'friendList')
        .then((results)=>{
            const friendList = results.friendList;
            console.log('FRIEDNLIST', friendList);
            post.aggregate()
            .match({_id:{$lt: mongoose.Types.ObjectId(endPost)}, userId :{$in: friendList}})
            .limit(count)   
            .then((results)=>{
                callback(null, results);
            }, (err)=>{
                callback(err, null);
            });
        }, (err)=>{
            callback(err, null);
    });
}

// 댓글 가져오기 getReplies - version of pagination
Post.getReplies = function(endReply, postId, count, callback){
    if (!endReply){
        endReply = "000000000000000000000000"; // ObjectId of 2105.12.31 23:59:59
    }
    console.log('START TO GET REPLY');
    post.aggregate()
        .match({ _id : mongoose.Types.ObjectId(postId)})
        .project('reply -_id')
        .unwind('$reply')
        .match({ 'reply._id' : {$gt : mongoose.Types.ObjectId(endReply)}})
        .limit(count)
        .then((results)=>{
            callback(null, results);
        }, (err)=>{
            callback(err, null);
        });
}

// 친구 유무 확인 요청에 대한 응답
function checkFriend(req, res, next){
    Post.getFriendCount((err, results)=>{
        var data;
        if (err){
            data = {
                msg: 'failure'
            }
            res.json(data);
            return next(err);
        }
        data = {
            msg : 'success',
            friendCount : results.friendList.length
        }
        res.json(data);
    });
}

// 친구소식
Post.getPostsTest = function(endPost, userId, count, callback){
    endPost = endPost || "ffce5eef0000000000000000"; // ObjectId of 2105.12.31 23:59:59
    count = count || 60;
    
    user.findOne({_id : userId}, 'friendList -_id')
        .then((results)=>{
            if (!results){  
                callback(err, null);
            }
            const friendList = results.friendList;
            const now = new Date();
            const nowMilli = new Date(0);
            console.log('FRIEDNLIST', friendList)
            var promise;
            var hasFriend = 1;
            switch(friendList.length){
                case 0:
                var projection = { 
                    category : 1, 
                    postAddress : 1, 
                    due : 1, 
                    nickname : 1, 
                    profileThumbnail : 1, 
                    postImg : 1, 
                    postThumbnail : 1,
                    postContent : 1,  
                    postDate :1,
                    year : {$substr : ['$postDate',0,4]},
                    month : {$substr : ['$postDate',5,2]},
                    day : {$substr : ['$postDate', 8,2]},
                    parsedDate : {$add : [{$subtract: [now, '$postDate']}, nowMilli]},
                    userId: 1, 
                    postLikeUsers: 1,
                    replyCount : 1,
                    postLikeCount : 1,
                    isLiked : {
                        $setIntersection : ['$postLikeUsers', [mongoose.Types.ObjectId(userId)]]
                    }
                }
                promise = post.aggregate().match({_id:{$lt: mongoose.Types.ObjectId(endPost)}}).project(projection);
                hasFriend = 0;
                default:
                // promise = post.find({_id:{$lt: mongoose.Types.ObjectId(endPost)}}, '-reply')
                //             .or([{userId : {$in: friendList}},{'reply.userId' : {$in:friendList}}])
                //             .limit(count)
                var projectionWithReply = { 
                    category : 1, 
                    postAddress : 1, 
                    due : 1, 
                    nickname : 1, 
                    profileThumbnail : 1, 
                    postImg : 1, 
                    postThumbnail : 1,
                    postContent : 1,  
                    postDate :1,
                    year : {$substr : ['$postDate',0,4]},
                    month : {$substr : ['$postDate',5,2]},
                    day : {$substr : ['$postDate', 8,2]},
                    parsedDate : {$add : [{$subtract: [now, '$postDate']}, nowMilli]},
                    userId: 1, 
                    postLikeUsers: 1,
                    replyCount : 1,
                    postLikeCount : 1,
                    postLikedAndFriend : {
                        $setIntersection : ['$postLikeUsers', friendList]
                    },
                    isLiked : {
                        $setIntersection : ['$postLikeUsers', [mongoose.Types.ObjectId(userId)]]
                    }
                }
                promise = post.aggregate()
                            .match({_id:{$lt: mongoose.Types.ObjectId(endPost)}})
                            .project(projectionWithReply)
                            .match({ $or : [{userId : {$in: friendList}},{'reply.userId' : {$in:friendList}}, {postLikedAndFriend : {$ne : []}}]})                 
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
            var projectionWithMyLike = { 
                category : 1, 
                postAddress : 1, 
                due : 1, 
                nickname : 1, 
                profileThumbnail : 1, 
                postImg : 1, 
                postThumbnail : 1,
                postContent : 1,  
                postDate : {
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
                userId: 1, 
                postLikeCount : 1,
                replyCount : 1,
                myLike : {
                    $cond : {if : { $ne : ['$isLiked', [] ] }, then : true, else : false }
                }
            }
            promise.project(projectionWithMyLike).sort({_id:-1}).limit(count).then((results)=>{
                callback(null, results, hasFriend);
                const end = new Date();
                console.log('EXECUTION TIME >>>', end-now);
            }, (err)=>{
                callback(err, null, null);
            });
        }, (err)=>{
            callback(err, null, null);
    });
}