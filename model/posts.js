const mongoose = require('mongoose');
const url = 'mongodb://52.78.98.25:27017/moundary';
mongoose.connect(url);
var db = mongoose.connection;
const postSchema = require('./Schema').post;
const userSchema = require('./Schema').user;
var post = mongoose.model('post', postSchema);
var user = mongoose.model('user', userSchema);
class Post{}

// 친구소식
// function temp(endPost, userId, count, callback){
//     if (!endPost){
//         endPost = "ffce5eef0000000000000000"; // ObjectId of 2105.12.31 23:59:59
//     }
//     user.findOne({_id : userId}, 'friendList')
//         .then((results)=>{
//             const friendList = results.friendList;
//             console.log('FRIEDNLIST', friendList)
//             post.find({_id:{$lt: mongoose.Types.ObjectId(endPost)}})
//             .where('userId').in(friendList)
//             .limit(count)
//             .then((results)=>{
//                 callback(null, results);
//             }, (err)=>{
//                 callback(err, null);
//             });
//         }, (err)=>{
//             callback(err, null);
//     });
// }
///////////////////////////////////////////////////////// 그냥 다 긁어와서 for문 돌려서 mylike 넣기
// Post.getPosts = function(endPost, userId, count, callback){
//     if (!endPost){
//         endPost = "ffce5eef0000000000000000"; // ObjectId of 2105.12.31 23:59:59
//     }
//     user.findOne({_id : userId}, 'friendList')
//         .then((results)=>{
//             const friendList = results.friendList;
//             console.log('FRIEDNLIST', friendList);
//             post.aggregate()
//             .match({_id:{$lt: mongoose.Types.ObjectId(endPost)}, userId :{$in: friendList}})
//             .limit(count)   
//             .then((results)=>{
//                 callback(null, results);
//             }, (err)=>{
//                 callback(err, null);
//             });
//         }, (err)=>{
//             callback(err, null);
//     });
// }

Post.getPosts(null, "57a04ad314779f0c027a9b0e", 5, (err, result)=>{
    if (err){
        console.log('err',err);
    }
    else{
        console.log('result',result);
    }
});

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
        diary.nickname =result.nickname;
        post.create(diary, (err, result)=>{
            if (err){
                return callback(err, null);
            }
            console.log('Recoding Complete');
            callback(null, result._id);
        });
    });
}

// 게시물 상세 정보 가져오기
Post.getPostDetail = function(postId, callback){

}

// 친구가 아직 없을 때 지역소식 불러오기
Post.getLocalPosts = function(endPost, userId, count, callback){

}

// 내 이야기 불러오기
Post.getMyPosts = function(endPost, userId, count, callback){

}

// 동네소식 불러오기, postAddress is Object
Post.getInfoPosts = function(endPost, postAddress, count, callback){

}



module.exports = Post;