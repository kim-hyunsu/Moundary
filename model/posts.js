const mongoose = require('mongoose');
const async = require('async');
const calculTime = require('./calculTime.js');
// const url = 'mongodb://52.78.98.25:27017/moundary';
// mongoose.connect(url);
var db = mongoose.connection;
const postSchema = require('./Schema').post;
const userSchema = require('./Schema').user;
const notificationSchema = require('./Schema').notification;
var post = mongoose.model('post', postSchema);
var user = mongoose.model('user', userSchema);
var notification = mongoose.model('notificaiton', notificationSchema);
class Post{}

// 친구소식
Post.getPosts = function(endPost, userId, count, callback){
    if (!endPost){
        endPost = "ffce5eef0000000000000000"; // ObjectId of 2105.12.31 23:59:59
    }
    if (!count){
        count = 10;
    }
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
                results.hasFriend = hasFriend;
                callback(null, results);
            }, (err)=>{
                callback(err, null);
            });
        }, (err)=>{
            callback(err, null);
    });
}

// 사용자의 주변의 동네소식 불러오기
Post.getInfoPostsNearby = function(endPost, userId, category, count, callback){
    if(!endPost){
        endPost = "ffce5eef0000000000000000"; // ObjectId of 2105.12.31 23:59:59
    }   
    if(!count){
        count = 10;
    }
    const now = new Date();
    const nowMilli = new Date(0);
    user.findOne({_id : userId}, 'userAddress -_id', (err, results)=>{
        if (err){
            return callback(err, null);
        }
        console.log('USER FOUND >>>', results);
        const userAddress = results.userAddress.toObject();
        console.log('USERADDRESS >>>', userAddress);
        var query = {};
        var projection1 = {
            category : 1, 
            postAddress : 1, 
            due : 1, 
            nickname : 1, 
            profileThumbnail : 1, 
            postImg : 1, 
            postThumbnail : 1,
            postContent : 1, 
            postDate : 1,
            year : {$substr : ['$postDate',0,4]},
            month : {$substr : ['$postDate',5,2]},
            day : {$substr : ['$postDate', 8,2]},
            parsedDate : {$add : [{$subtract: [now, '$postDate']}, nowMilli]}, 
            userId: 1, 
            postLikeCount : 1,
            replyCount : 1,
            myLike : {
                $cond : {if : { $setIsSubset : [[mongoose.Types.ObjectId(userId)], '$postLikeUsers' ] }, then : true, else : false }
            }
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
            myLike : 1
        }
        for(var key in userAddress){
            query["postAddress."+key] = userAddress[key];
        }
        delete query['postAddress.area5'];
        delete query['postAddress.area3'];
        if (category){
            query.category = category;
        }
        console.log('QUERY>>>', query);
        // var promise = post.find(query, '-reply').where('_id').lt(mongoose.Types.ObjectId(endPost));
        var promise = post.aggregate().match({_id : { $lt : mongoose.Types.ObjectId(endPost)}})
                        .match(query).project(projection1).project(projection2);
        if (!category){
            promise = promise.match({category : {$ne : 0}});
        }
        console.log('CHECK PROMISE');
        promise.sort({_id:-1}).limit(count)
            .then((result)=>{
                console.log('POST FOUND >>>', result);
                result.userAddress = userAddress;
                callback(null, result);
            }, (err)=>{
                callback(err, null);
            });
    });
}

// 사용자가 입력한 주소에 해당하는 동네소식 불러오기, postAddress is Object
Post.getInfoPostsByAddress = function(endPost, postAddress, category, count, callback){
    if(!endPost){
        endPost = "ffce5eef0000000000000000"; // ObjectId of 2105.12.31 23:59:59
    }
    if (!count){
        count = 10;
    }
    const now = new Date();
    const nowMilli = new Date(0);
    var query = {};
    var projection1 = {
        category : 1, 
        postAddress : 1, 
        due : 1, 
        nickname : 1, 
        profileThumbnail : 1, 
        postImg : 1, 
        postThumbnail : 1,
        postContent : 1, 
        postDate : 1, 
        year : {$substr : ['$postDate',0,4]},
        month : {$substr : ['$postDate',5,2]},
        day : {$substr : ['$postDate', 8,2]},
        parsedDate : {$add : [{$subtract: [now, '$postDate']}, nowMilli]},
        userId: 1, 
        postLikeCount : 1,
        replyCount : 1,
        myLike : {
            $cond : {if : { $setIsSubset : [[mongoose.Types.ObjectId(userId)], '$postLikeUsers' ] }, then : true, else : false }
        }
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
        myLike : 1
    }
    for(var key in postAddress){
        query["postAddress."+key] = postAddress[key];
    }
    if (category){
        query.category = category;
    }
    // var promise = post.find(query, '-reply').where('_id').lt(mongoose.Types.ObjectId(endPost));
    var promise = post.aggregate().match({_id : {$lt : mongoose.Types.ObjectId(endPost)}})
                    .match(query).project(projection1).project(projection2);
    if (!category){
        promise = promise.match({category : {$ne : 0}});
    }
    promise.sort({_id:-1}).limit(count)
        .then((results)=>{
            callback(null, results);
        }, (err)=>{
            callback(err, null)
        });
}

Post.getInfoPostsByWord = function(word, endPost, userId, count, callback){
    console.log('searching posts....');
    endPost = endPost || "ffce5eef0000000000000000"; // ObjectId of 2105.12.31 23:59:59
    count = count || 10; 
    word = word || '';
    const now = new Date();
    const nowMilli = new Date(0);
    var projection1 = {
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
        replyCount : 1,
        postLikeCount : 1,
        myLike : {
            $cond : [ {$setIsSubset : [[mongoose.Types.ObjectId(userId)], '$postLikeUsers']}, true, false]
        }
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
        replyCount : 1,
        postLikeCount : 1,
        myLike : 1
    }
    post.aggregate()
        .match({_id : {$lt : mongoose.Types.ObjectId(endPost)}, postContent : new RegExp(word)})
        .match({category : {$ne : 0}})
        .project(projection1).project(projection2)
        .sort({_id : -1}).limit(count)
        .then((result)=>{
            console.log('POSTS FOUND');
            callback(null, result);
        }, (err)=>{
            callback(err, null);
        });
}

// 내 이야기 불러오기
Post.getMyPosts = function(endPost, userId, count, callback){
    if(!endPost){
        endPost = "ffce5eef0000000000000000"; // ObjectId of 2105.12.31 23:59:59
    }   
    if(!count){
        count = 10;
    }
    const now = new Date();
    const nowMilli = new Date(0);
    var projection1 = {
        category : 1, 
        postAddress : 1, 
        due : 1, 
        nickname : 1, 
        profileThumbnail : 1, 
        postImg : 1, 
        postThumbnail : 1,
        postContent : 1, 
        postDate : 1,
        year : {$substr : ['$postDate',0,4]},
        month : {$substr : ['$postDate',5,2]},
        day : {$substr : ['$postDate', 8,2]},
        parsedDate : {$add : [{$subtract: [now, '$postDate']}, nowMilli]}, 
        userId: 1,
        postLikeCount : 1,
        replyCount : 1,
        myLike : {
            $cond : {if : { $ne : [[mongoose.Types.ObjectId(userId)], '$postLikeUsers' ] }, then : true, else : false }
        }
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
        myLike : 1
    }
    post.aggregate().match({userId : mongoose.Types.ObjectId(userId), _id : {$lt : mongoose.Types.ObjectId(endPost)}})
        .project(projection1).project(projection2)
        .sort({_id:-1}).limit(count)
        .then((results)=>{
            callback(null, results);
        }, (err)=>{
            callback(err, null);
        });
}

// 게시물 db 저장, post is Object
// diary ={
//     category : 0, //diary
//     userId : userId,
//     postImg : imageUrl,
//     postContent : postContent,
//     postDate : now,
//     postLikeUsers : [],
//     reply : [] 
// }
Post.recordPost = function(APost, callback){
    console.log('Recording the post');
    user.findOne({_id : APost.userId}, 'nickname profileThumbnail', (err, results)=>{
        if (err || !results){
            return callback(err, null);
        }
        APost.nickname = results.nickname;
        APost.profileThumbnail = results.profileThumbnail;
        post.create(APost, (err, result)=>{
            if (err){
                return callback(err, null);
            }
            console.log('Recording Complete');
            APost._id = result._id;
            callback(null, APost);
        });
    });
}
// Post.recordPost = function(APost, callback){
//     console.log('Recording the post');
//     post.create(APost, (err, result)=>{
//         if (err){
//             return callback(err, null);
//         }
//         console.log('ID >>>', result._id);
//         post.find({_id : result._id})
//             .populate({
//                 path : 'nickname',
//                 match : {_id : APost},
//                 select : 'nickname -_id'
//             })
//             .then((results)=>{
//                 console.log('RESULT >>>', results);
//                 callback(null, results);
//             }, (err)=>{
//                 callback(err, null);
//             });
//     });
// }
// Post.recordPost = function(APost, callback){
//     console.log('Recording the post');
//     post.create(APost)
//         .populate({
//             path : 'nickname',
//             match : {_id : APost.userId},
//             select : 'nickname'
//         })
//         .populate({
//             path : 'profileThumbnail',
//             match : {_id : APost.userId},
//             select : 'profileThumbnail'
//         })
//         .then((results)=>{
//             console.log('RESULT >>>', results);
//             callback(null, results);
//         }, (err)=>{
//             callback(err, null);
//         });
// }

// 게시물 상세 정보 가져오기
Post.getPostDetail = function(userId, postId, callback){
    const projection = {
        category: 1,
        postAddress : 1,
        due : 1,
        userId : 1,
        nickname : 1,
        profileThumbnail :1,
        postImg : 1,
        postThumbnail :1,
        postContent : 1,
        postDate :1,
        postLikeCount : 1,
        replyCount : 1,
        myLike : {
            $cond : [
                {$setIsSubset : [[mongoose.Types.ObjectId(userId)], '$postLikeUsers']}, true, false
            ]
        },
        'reply._id' : 1,
        'reply.userId' : 1,
        'reply.profileThumbnail' : 1,
        'reply.replyContent' : 1,
        'reply.nickname' : 1,
        'reply.replyDate' : 1
        // ,'reply.replyLikeCount' : 1,
        // 'reply.myLike' : {
        //     $cond : [{ $setIsSubset : [[mongoose.Types.ObjectId(userId)], '$reply.replyLikeUsers']}, true, false]
        // }
    };
    post.aggregate()
        .match({_id : mongoose.Types.ObjectId(postId)})
        .project(projection)
        .then((doc)=>{
            console.log(doc);
            callback(null, doc[0]);
        }, (err)=>{
            callback(err, null);
        });
}

// 댓글 가져오기
Post.getReplies = function(endReply, userId, postId, count, callback){
    console.log('getting replies...');

    // endReply = endReply || "000000000000000000000000"; //object id of 1970.01.01 09:00:00
    endReply = endReply || 0;    
    count = count || 10;
    post.findOne({ _id : postId}, 'reply -_id')
        .slice('reply', [endReply, count])
        .then((results)=>{
            console.log('REPLY FOUND >>>', results.reply);
            endReply = endReply+results.reply.length;
            console.log('ENDREPLY ADDED >>>', results.reply);
            callback(null, results.reply, endReply);
        }, (err)=>{
            console.log('REPLY NOT FOUND');
            callback(err, null, null);
        });
    console.log('USERID>>>', userId);
    // const now = new Date();
    // const nowMilli = new Date(0);
    // var projection1 = {
    //     'reply._id' : 1,
    //     'reply.userId' : 1,
    //     'reply.profileThumbnail' : 1,
    //     'reply.replyContent' : 1,
    //     'reply.nickname' : 1,
    //     'reply.replyDate' : 1,
    //     'reply.year' : {$substr : ['$reply.$replyDate',0,4]},
    //     'reply.month' : {$substr : ['$replyDate',5,2]},
    //     'reply.day' : {$substr : ['$replyDate', 8,2]},
    //     'reply.parsedDate' : {$add : [{$subtract: [now, '$replyDate']}, nowMilli]}
    // }
    // const format = { $cond : [
    //     {$ne : ['$$year', 1970]},
    //     {$concat : ['$year','.','$month','.', '$day']},
    //     {$cond : [
    //         {$ne : ['$$month',1]},
    //         {$concat : ['$year','.','$month','.', '$day']},
    //         {$cond : [
    //             {$ne : ['$$day', 1]},
    //             {$concat : ['약 ',{$substr : ['$$day', 0 ,-1]}, '일 전']},
    //             {$cond : [
    //                 '$$hours',
    //                 {$concat : ['약 ',{$substr : ['$$hours', 0, -1]}, '시간 전']},
    //                 {$cond : [
    //                     '$$minutes',
    //                     {$concat : ['약 ', {$substr : ['$$minutes', 0, -1]}, '분 전']},
    //                     {$cond : [
    //                         '$$seconds',
    //                         {$concat : ['약 ', {$substr : ['$$seconds', 0, -1]}, '초 전']},
    //                         '몇 초 전'
    //                     ]}
    //                 ]}
    //             ]}
    //         ]}
    //     ]}
    // ]}
    // var projection2 = {
    //     'reply._id' : 1,
    //     'reply.userId' : 1,
    //     'reply.profileThumbnail' : 1,
    //     'reply.replyContent' : 1,
    //     'reply.nickname' : 1,
    //     'reply.replyDate' : {
    //         $let : {
    //             vars : {
    //                 year : {$year : '$reply.parsedDate'},
    //                 month : {$month : '$reply.parsedDate'},
    //                 day : {$dayOfMonth : '$reply.parsedDate'},
    //                 hours : {$hour : '$reply.parsedDate'},
    //                 minutes : {$minute : '$reply.parsedDate'},
    //                 seconds:  {$second : '$reply.parsedDate'}
    //             },
    //             in : format
    //         }
    //     },
    // }
    // post.aggregate()
    //     .match({_id : mongoose.Types.ObjectId(postId)})
    //     .project('reply -_id')
    //     .project({reply : {$slice : ['$reply', endReply, count]}})
    //     // .match({'reply._id': {$gt : mongoose.Types.ObjectId(endReply)}})
    //     // .project({'reply.$' : 1})
    //     // .unwind('reply')
    //     .project(projection1)
    //     .limit(count)
    //     .sort({'reply._id' : -1})
    //     .then((results)=>{
    //         console.log('REPLY FOUND >>>', results);
    //         // endReply = results[0].reply[0]._id; =>> todo
    //         if (results[0]){
    //             endReply = endReply+results[0].reply.length;
    //             callback(null, results[0].reply, endReply);
    //         } else {
    //             callback(null, [], endReply);
    //         }
    //     }, (err)=>{
    //         console.log('REPLY NOT FOUND');
    //         callback(err, null, null);
    //     });
}

// 포스트  document에 댓글 넣기
// reply = {postId : , replyContent : , userId : }
Post.recordReply = function(reply, callback){
    reply.replyLikeUsers = [];
    console.log('Let me show the reply one more >>>', reply);
    user.findOne({_id : reply.userId}, 'profileThumbnail nickname', (err, results)=>{
        if (err){
            return callback(err,null);
        }   
        console.log('USER FINDING COMPLETE');
        console.log('THE RESULT', results);
        reply.profileThumbnail = results.profileThumbnail;
        reply.nickname = results.nickname;
        post.findOneAndUpdate({_id : reply.postId}, {$push: {reply : reply}, $inc: {replyCount : 1}}, {new : true, upsert : true, fields : 'reply'}, (err, doc)=>{
            if (err){
                return callback(err, null); 
            }
            console.log('REPLY UPDATE COMPLETE');
            console.log('replyUpload', doc);
            callback(null, doc.reply);
        });
    });
}

// userId에 해당하는 유저가 쓴 모든 글과 댓글의 userInfo(nickname or profileThumbnail)변경
Post.updatePostUserInfo = function(userId, userInfo, callback){
    // 유저가 쓴 모든 post의 profileThumbnail 수정
    post.update({userId : userId}, userInfo, {multi:true}, (err, result)=>{
        if (err){
            return callback(err);
        }
        // 유저가 쓴 모든 댓글의 profileThumbnail 수정
        var query = {};
        for(var key in userInfo){
            query['reply.$.'+key] = userInfo[key];
        }
        post.find({'reply.userId' : userId}, (err, docs)=>{
            if (err){
                return callback(err);
            }
            async.each(docs, (ele, postCb)=>{
                async.each(ele.reply, (item, replyCb)=>{
                    for(var key in userInfo){
                        item[key] = userInfo[key];
                    }
                    replyCb();
                }, (err)=>{
                    if (err){
                        return postCb(err);
                    }
                    ele.save((err   , saved)=>{
                        if (err){
                            return postCb(err);
                        }
                        postCb();
                    });
                });
            }, (err)=>{
                if (err){
                    return callback(err);
                }
                callback(null);
            });
        });
        if (userInfo.nickname){
            notification.update({pusherId : userId}, {pusherNickname : userInfo.nickname}, {multi : true}, (err, result)=>{
                if (err){
                    return callback(err);
                }
            });
        }
        if (userInfo.profileThumbnail){
            notification.update({pushType : 0, pusherId : userId}, {img : userInfo.profileThumbnail}, {multi : true}, (err, result)=>{
                if (err){
                    return callback(err);
                }
            });
        }
    });
}

// 기간 지난 포스트 삭제
Post.deleteExpiredPosts = function(callback){
    const now = new Date();
    post.findOneAndRemove({due: {$lt : now}}, {fields : 'postImg postThumbnail'})
        .then((doc)=>{
            callback(null, doc);
        }, (err)=>{
            callback(err, null);
        });
}

Post.updatePost = function(userId, postId, query, callback){
    post.findOneAndUpdate({_id : postId, userId : userId}, query, {new : true, fields : '-reply'})
        .then((doc)=>{
            callback(null, doc);
            if (query.postThumbnail){
                notification.update({pushType : 1, postId : postId}, {img : query.postThumbnail}, {multi: true}, (err, result)=>{
                    if (err){
                        console.log('FAIL TO UPDATE THR POSTTHUMBNAIL OF %s IN NOTIFICATION COLLECTION', postId);
                    }
                });
            }
        }, (err)=>{
            callback(err, null);
        });
}

Post.removePost = function(userId, postId, callback){
    post.findOneAndRemove({_id : postId, userId : userId}, {fields : 'postImg postThumbnail userId'})
        .then((doc)=>{
            callback(null, doc);
        }, (err)=>{
            callback(err, null);
        });
}   

Post.likePost = function(postId, query, callback){
    post.findOneAndUpdate({_id : postId}, query, {new : true, fields : '-reply'})
        .then((doc)=>{
            callback(null, doc);
        }, (err)=>{
            callback(err, null);
        });
}

Post.updateReply = function(userId, postId, replyId, query, callback){
    post.update({_id : postId, 'reply.userId' : userId, 'reply._id' : replyId}, query)
        .then((result)=>{
            callback();
        }, (err)=>{
            callback(err);
        });
}

Post.likeReply = function(postId, replyId, query, callback){
    post.update({_id : postId, 'reply._id' : replyId }, query)
        .then((result)=>{
            callback();
        }, (err)=>{
            callback(err);
        });
}

Post.checkPostLiked = function(userId, postId, callback){
    post.findOne({_id : postId, 'postLikeUsers' : userId})
        .count((err, count)=>{
            if (err){
                callback(err);
            } else if (count == 0){
                callback(null, false);
            } else {
                callback(null, true);
            }
        });
}

Post.checkReplyLiked = function(userId, postId, replyId, callback){
    post.findOne({_id : postId, 'reply._id' : replyId, 'reply.replyLikeUsers' : userId})
        .count((err, count)=>{
            console.log('COUNT', count);
            if (err){
                callback(err);
            } else if (count == 0){
                callback(null, false);
            } else {
                callback(null, true);
            }
        });
}

// 이미지 삭제를 위해 기존 이미지 url 얻기
Post.getImageUrl = function(what, postId, callback){
    post.findOne({_id : postId}, what, (err, doc)=>{
        if (err){
            return callback(err, null);
        }
        callback(null, doc);
    });
}

// 검색 키워드 얻기
Post.getContentsKeyword = function(word, callback){
    post.find({postContent : new RegExp('\\s+'+word+'|'+'^'+word, 'gi')}, 'postContent').limit(6)
        .then((docs)=>{
            var wordList = [];
            async.each(docs, (ele, cb)=>{
                key = new RegExp('\\s*'+word+'\\S*\\s*|^'+word+'\\S*', 'gi');
                wordList = wordList.concat(ele.postContent.match(key));
                cb();
            }, (err)=>{
                if (err){
                    return callback(err, null);
                }
                wordList.sort((a,b)=>{
                    return a.length-b.length;
                });
                wordList = wordList.splice(0, 6);
                newlist = [];
                wordList.forEach(item=>{
                    newlist.push(item.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/\s]/gi, ''));
                });
                callback(null, newlist);
            });
        }, (err)=>{
            callback(err, null);
        });
}

module.exports = Post;