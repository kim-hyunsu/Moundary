
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