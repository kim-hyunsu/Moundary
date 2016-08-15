const Post = require('../model/posts.js');
const s3upload = require('./s3upload.js');
const Agenda = require('agenda');
var mongoConnectionString = "mongodb://52.78.98.25:27017/moundary";
var agenda = new Agenda({db: {address: mongoConnectionString}});

module.exports = function(agenda){
    agenda.define('deleteExpiredPosts', (job, done)=>{
        Post.deleteExpiredPosts( (err, doc)=>{
            if (err){
                console.log('FAIL TO DELETE EXPIRED POSTS >>>', err.message);
                return done(err);
            }
            console.log('DELETED EXPIRED POSTS >>>', doc);
            done(null);
            s3upload.delete(doc.postImg, (err, result)=>{
                if (err){
                    console.log('FAIL TO DELETE THE IMAGE IN S3 >>>', doc.postImg);
                }
            });
            s3upload.delete(doc.postThumbnail, (err, result)=>{
                if (err){
                    console.log('FAIL TO DELETE THE IMAGE IN S3 >>>', doc.postThumbnail);
                }
            });
        });
    });
}