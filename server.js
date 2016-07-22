const AWS = require('aws-sdk');
const config = require('./s3config.js');

AWS.config.accessKeyId = config.accessKeyId;
AWS.config.secretAccessKey = config.secretAccessKey;

const s3 = new AWS.S3();

console.log('endpoint : ', s3.endpoint);
console.log('href', s3.endpoint.href);