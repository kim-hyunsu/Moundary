const Post = require('../model/posts.js');
const Agenda = require('agenda');
var mongoConnectionString = "mongodb://52.78.98.25:27017/moundary";
var agenda = new Agenda({db: {address: mongoConnectionString}});

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