const mongoose = require('mongoose');
// const url = 'mongodb://52.78.98.25:27017/moundary';
// mongoose.connect(url);
var db = mongoose.connection;
const postSchema = require('./Schema').post;
const userSchema = require('./Schema').user;
var post = mongoose.model('post', postSchema);
var user = mongoose.model('user', userSchema);
class Post{}

// 친구소식
Post.getPosts = function(endPost, userId, count, callback){
    if (!endPost){
        endPost = "ffce5eef0000000000000000"; // ObjectId of 2105.12.31 23:59:59
    }
    user.findOne({_id : userId}, 'friendList')
        .then((results)=>{
            const friendList = results.friendList;
            console.log('FRIEDNLIST', friendList)
            var promise;
            var hasFriend = 1;
            switch(friendList.length){
                case 0:
                promise = post.find({_id:{$lt: mongoose.Types.ObjectId(endPost)}}, '-reply').limit(count);
                hasFriend = 0;
                default:
                promise = post.find({_id:{$lt: mongoose.Types.ObjectId(endPost)}}, '-reply')
                            .where('userId').in(friendList)
                            .limit(count)
            }
            promise.then((results)=>{
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
    user.findOne({_id : userId}, 'postAddress -_id', (err, results)=>{
        if (err){
            return callback(err, null);
        }
        var query = {};
        for(var key in results.postAddress){
            query["postAddress."+key] = postAddress[key];
        }
        if (category){
            query.category = category;
        }
        post.find(query, '-reply')
            .where('_id').lt(mongoose.Types.ObjectId(endPost)).limit(count)
            .then((results)=>{
                callback(null, results);
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
    var query = {};
    var promise = post.find(query, '-reply').where('_id').lt(mongoose.Types.ObjectId(endPost));
    for(var key in postAddress){
        query["postAddress."+key] = postAddress[key];
    }
    if (category){
        query.category = category;
    }
    else{
        promise = promise.where('category').ne(0)
    }
    promise.limit(count)
        .then((results)=>{
            callback(null, results);
        }, (err)=>{
            callback(err, null)
        });
}

// 내 이야기 불러오기
Post.getMyPosts = function(endPost, userId, count, callback){
    if(!endPost){
        endPost = "ffce5eef0000000000000000"; // ObjectId of 2105.12.31 23:59:59
    }   
    post.find({userId : userId, _id:{$lt: mongoose.Types.ObjectId(endPost)}}, '-reply').limit(count)
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
Post.recordPost = function(diary, callback){
    console.log('Recording the post');
    diary.userId = mongoose.Types.ObjectId(diary.userId);
    user.findOne({_id : diary.userId}, 'nickname', (err, result)=>{
        diary.nickname = result.nickname;
        post.create(diary, (err, result)=>{
            if (err){
                return callback(err, null);
            }
            console.log('Recording Complete');
            callback(null, result._id);
        });
    });
}

// 게시물 상세 정보 가져오기
Post.getPostDetail = function(postId, callback){
    post.findOne({_id : postId}, '-reply', (err, results)=>{
        if (err){
            return callback(err, null);
        }
        callback(null, results);
    });
}

// 댓글 가져오기
Post.getReplies = function(postId, callback){
    post.findOne({ _id : postId}, 'reply -_id')
        .then((results)=>{
            callback(null, results.reply);
        }, (err)=>{
            callback(err, null);
        });
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
        post.update({_id : reply.postId}, {$pushAll: {reply : [reply]}}, {upsert : true}, (err, result)=>{
            if (err){
                return callback(err, null); 
            }
            console.log('REPLY UPDATE COMPLETE');
            console.log('replyUpload', result);
            callback(null, result);
        });
    });
}



module.exports = Post;