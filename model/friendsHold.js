const mongoose = require('mongoose');
const url = 'mongodb://52.78.98.25:27017/moundary';
mongoose.connect(url);
var db = mongoose.connection;
class Holder{}

module.exports = Holder;