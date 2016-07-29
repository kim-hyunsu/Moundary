const postSchema = require('./Schema').post;
const userSchema = require('./Schema').user;
var post = mongoose.model('post', postSchema);
var user = mongoose.model('user', userSchema);
class Post{}

// 친구소식
Post.getPosts = function(endPost, userId, count, callback){
    user.findOne({_id : mongoose.Types.ObjectId(userId)}, 'friendList')
        .then((results)=>{
            const friendList = results.friendList;
            post.find({_id:{$gt: mongoose.Types.ObjectId(endPost)}})
            .where('userId').in(friendList)
            .limit(count)
            .then((results)=>{
                callback(null, results);
            }, (err)=>{
                return callback(err, null);
            });
        }, (err)=>{
            return callback(err, null);
    });
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

// 친구소식 db 저장, post is Object
Post.recordPost = function(post, callback){
    
}

module.exports = Post;