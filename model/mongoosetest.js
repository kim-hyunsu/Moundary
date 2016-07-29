const mongoose = require('mongoose');
const async = require('async');
const url = 'mongodb://52.78.98.25:27017/moundary';
mongoose.connect(url);
var db = mongoose.connection;

userSchema = mongoose.Schema({
    userId :mongoose.Schema.Types.ObjectId,
    friendList :[mongoose.Schema.Types.ObjectId]
});

const user = mongoose.model('user', userSchema);

postSchema = mongoose.Schema({
    postId : mongoose.Schema.Types.ObjectId,
    userId : mongoose.Schema.Types.ObjectId,

    postContent : String
});

const post = mongoose.model('post', postSchema);

// userSchema = mongoose.Schema({
//     userId :String,
//     friendList :[String]
// });

// const user = mongoose.model('user', userSchema);

// postSchema = mongoose.Schema({
//     postId : String,
//     userId : String,
//     postContent : String
// });

// const post = mongoose.model('post', postSchema);

// user1id = mongoose.Types.ObjectId();
// user2id = mongoose.Types.ObjectId();
// user3id = mongoose.Types.ObjectId();

// var user1 = new user({_id : user1id, friendList : [user2id, user3id]});
// var user2 = new user({_id : user2id, friendList : [user1id, user3id]});
// var user3 = new user({_id : user3id, friendList : [user2id, user1id]});

// var post1 = new post({userId : user1id, postContent : '포스트1'});
// var post2 = new post({userId : user2id, postContent : '포스트2'});
// var post3 = new post({userId : user3id, postContent : '포스트3'});
// user.create({num:4}, (err, result)=>{
//     user.create({num:5}, (err,result)=>{
//         user.create({num:6}, (err,result)=>{});
//     });
// });

// async.series([
//     (callback)=>{
//         user.create({num:1}, (callback()));
//     },
//     (callback)=>{
//         user.create({num:2}, (callback()));
//     },
//     (callback)=>{
//         user.create({num:3}, (callback()));
//     }
// ]);

// async.series([
//     (callback)=>{
//         user1.save(callback(null,null));
//     },
//     (callback)=>{
//         user2.save(callback(null,null));
//     },
//     (callback)=>{
//         user3.save(callback(null,null));
//     },
//     (callback)=>{
//         post1.save(callback(null,null));
//     },
//     (callback)=>{
//         post2.save(callback(null,null));
//     },
//     (callback)=>{
//         post3.save(callback(null,null));
//     }
// ]);

// user1.save((err,product)=>{
//     user2.save((err,product)=>{
//         user3.save((err,product)=>{
//             post1.save((err,product)=>{
//                 post2.save((err,product)=>{
//                     post3.save((err,product)=>{

//                     })
//                 });
//             });
//         });
//     });
// });

// user.aggregate()
//     .unwind('$friendList')
//     .lookup({from : 'posts', localField : 'friendList', foreignField : 'userId', as : 'posts'})
//     .match({'_id' : mongoose.Types.ObjectId("579b1a256cb651040bd91ede")})
//     .unwind('$posts')
//     .project('posts')
//     .sort({'posts.postContent':-1})
//     .then((results)=>{
//         console.log('results', results);
//         async.eachSeries(results, (item, next)=>{
//             console.log('item',item);
//             console.log(item._id.toString());
//             next(null, item);
//         }, (err, result)=>{
//             // console.log(err);
//         });
//     }, (err)=>{
//         console.log(err);
//     });

user.findOne({_id : mongoose.Types.ObjectId("579b1a256cb651040bd91ede")}, 'friendList')
    .then((results)=>{
        console.log(results.friendList[0]);
    }, (err)=>{
        console.log(err);
    });
