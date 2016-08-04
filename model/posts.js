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
    user.findOne({_id : userId}, 'friendList -_id')
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
    user.findOne({_id : userId}, 'userAddress -_id', (err, results)=>{
        if (err){
            return callback(err, null);
        }
        const userAddress = results.userAddress;
        var query = {};
        for(var key in userAddress){
            query["postAddress."+key] = userAddress[key];
        }
        if (category){
            query.category = category;
        }
        post.find(query, '-reply')
            .where('_id').lt(mongoose.Types.ObjectId(endPost)).limit(count)
            .then((results)=>{
                results.userAddress = userAddress;
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
    for(var key in postAddress){
        query["postAddress."+key] = postAddress[key];
    }
    if (category){
        query.category = category;
    }
    var promise = post.find(query, '-reply').where('_id').lt(mongoose.Types.ObjectId(endPost));
    if (!category){
        promise = promise.where('category').ne(0);
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
Post.recordPost = function(APost, callback){
    console.log('Recording the post');
    APost.userId = mongoose.Types.ObjectId(APost.userId);
    APost.findOne({_id : APost.userId}, 'nickname profileThumbnail', (err, results)=>{
        APost.nickname = results.nickname;
        APost.profileThumbnail = results.profileThumbnail;
        post.create(APost, (err, result)=>{
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
Post.getReplies = function(endReply, postId, count, callback){
    post.findOne({ _id : postId}, 'reply -_id')
        .splice('reply', [endReply, count])
        .then((results)=>{
            results.reply.endReply = endReply+count;
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
        post.update({_id : reply.postId}, {$pushAll: {reply : [reply]}, $inc: {replyCount : 1}}, {upsert : true}, (err, result)=>{
            if (err){
                return callback(err, null); 
            }
            console.log('REPLY UPDATE COMPLETE');
            console.log('replyUpload', result);
            callback(null, result);
        });
    });
}

// userId에 해당하는 유저가 쓴 모든 글과 댓글의 userInfo(nickname or profileThumbnail)변경
Post.updatePostUserInfo = function(userId, userInfo, callback){
    // 유저가 쓴 모든 post의 profileThumbnail 수정
    post.update({userId : userId}, userInfo, {upsert: true}, (err, result)=>{
        if (err){
            return callback(err, null);
        }
        // 유저가 쓴 모든 댓글의 profileThumbnail 수정
        var query = {}
        for(var key in userInfo){
            query['$set']['reply.$.'+key] = userInfo[key];
        }
        post.update({'reply.userId' : userId}, query, {upsert :true}, (err,results)=>{
            if (err){
                return callback(err, null);
            }
            result.results = results
            callback(null, result); //결과값 제대로 정하기
        });
    });
}



module.exports = Post;