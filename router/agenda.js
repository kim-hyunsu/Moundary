const Post = require('../model/posts.js');

module.exports = function(agenda){
    agenda.define('deleteExpiredPosts', (job, done)=>{
        Post.deleteExpiredPosts( (err, result)=>{
            if (err){
                console.log('FAIL TO DELETE EXPIRED POSTS >>>', err.message);
                return done(err);
            }
            console.log('DELETED EXPIRED POSTS >>>', result);
            done(null);
        });
    });
}