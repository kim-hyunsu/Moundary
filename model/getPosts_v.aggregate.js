Post.getPosts = function(endPost, userId, count, callback){
    if (!endPost){
        endPost = "ffce5eef0000000000000000"; // ObjectId of 2105.12.31 23:59:59
    }
    user.findOne({_id : userId}, 'friendList')
        .then((results)=>{
            const friendList = results.friendList;
            console.log('FRIEDNLIST', friendList)
            post.find({_id:{$lt: mongoose.Types.ObjectId(endPost)}})
            .where('userId').in(friendList)
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