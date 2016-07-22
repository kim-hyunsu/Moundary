const fs = require('fs');
const pathUtil = require('path');
const AWS = require('aws-sdk');
const config = require('s3config');

AWS.config.accessKeyId = config.accessKeyId;
AWS.config.secretAccessKey = config.secretAccessKey;

const file = './images/road'