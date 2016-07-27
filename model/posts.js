const mongoose = require('mongoose');

class Post{}

// 친구소식 불러오기
Post.getPosts = function(endPost, userId, count, callback){

}

// 친구가 아직 없을 때 지역소식 불러오기
Post.getLocalPosts = function(endPost, userId, count, callback){

}

// 동네소식 불러오기
Post.getInfoPosts = function(endPost, area1, area2, area3, area4, count, callback){

}


module.exports = Post;