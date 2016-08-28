// modules
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const formidable = require('express-formidable');
const morgan = require('morgan');
const mongoose = require('mongoose');
const Agenda = require('agenda');
const fs = require('fs');
const async = require('async');

// mongodb connection, mongoose used
const url = 'mongodb://52.78.98.25:27017/moundary';
mongoose.connect(url);
// var db = mongoose.connection;

// routers
const loginRouter = require('./router/loginRouter.js');
const newsfeedRouter = require('./router/newsfeedRouter.js');
const infoRouter = require('./router/infoRouter.js');
const replyRouter = require('./router/replyRouter.js');
const userRouter = require('./router/userRouter.js');
const searchRouter = require('./router/searchRouter');

// agenda
var mongoConnectionString = "mongodb://52.78.98.25:27017/moundary";
var agenda = new Agenda({db: {address: mongoConnectionString}});
const Post = require('./model/posts.js');
const Notification = require('./model/notifications.js');
// delete expired information posts.
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
// delete notifications generated 7 days ago.
agenda.define('deleteOldNotifications', (job, done)=>{
    Notification.deleteOldNotifications( (err, result)=>{
        if (err){
            console.log('FAIL TO DELETE Old Notifications >>>', err.message);
            return done(err);
        }
        console.log('DELETED Old Notifications >>>', result);
        done(null);
    });
});
agenda.define('deleteRemainedFiles', (job, done)=>{
    fs.readdir('./upload/*', (err, list)=>{
        if (err){
            console.log('NO UPLOAD FILE');
        }
        async.eachSeries(list, (ele, next)=>{
            fs.unlink('./upload/'+ele, (err)=>{
                if (err){
                    console.log('FAIL TO DELETE >>>', ele);
                }
                next(null, null);
            });
        });
    });
})
// execute the agenda every hours
agenda.on('ready', ()=>{
    agenda.every('1 hours', 'deleteExpiredPosts');
    agenda.every('1 hours', 'deleteOldNotifications');
    agenda.every('1 hours', 'deleteRemainedFiles');
    agenda.start();
});

// middleware
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended:false})); // transmit with urlencoded
app.use(formidable.parse({ // and multipart
    encoding : 'utf-8',
    uploadDir : __dirname + '/upload',
    keepExtensions : true,
    multiples : true
})); 
app.use(loginRouter);
app.use(newsfeedRouter);
app.use(infoRouter);
app.use(replyRouter);
app.use(userRouter);
app.use(searchRouter);
app.use(errorCtrl);
app.listen(3000);

//errorCtrl
function errorCtrl(err, req, res, next){
    console.log('==ERROR MESSAGE========================================');
    console.log(err);
    console.log('==ERROR MESSAGE========================================');
    const data = {
        msg : 'failure'
    }
    res.status(err.code).json(data);
}