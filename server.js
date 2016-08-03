// modules
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');

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

// middleware
app.use(morgan('dev'));
app.use(bodyParser.json()); // transmit with json
app.use(loginRouter);
app.use(newsfeedRouter);
app.use(infoRouter);
app.use(replyRouter);
app.use(userRouter);
app.use(errorCtrl);
app.listen(3000);

//errorCtrl
function errorCtrl(err, req, res, next){
    res.sendStatus(err.code);
    console.log('==ERROR MESSAGE========================================');
    console.log(err);
    console.log('==ERROR MESSAGE========================================');
}