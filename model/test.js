use moundary;

// db.post.insert({postId : 'post1id', userId : 'user1id', postContent : '테스트 중...'});
// db.post.insert({postId : 'post2id', userId : 'user2id', postContent : '유저 2'});
// db.post.insert({postId : 'post3id', userId : 'user2id', postContent : '유저 2, 2222'});


db.user.insert({friendList : [ObjectId("579ea89d5aff3e081b313d23"),]});
// db.user.insert({userId : 'user2id', friendList : ['user1id']});

// db.user.aggregate([
//     {$unwind: '$friendList'},
//     {
//         $lookup : {
//             from : 'post',
//             localField: 'friendList',
//             foreignField: 'userId',
//             as : 'friendPosts'
//         }
//     }

// ]);

