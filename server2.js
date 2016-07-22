const fs = require('fs');
const pathUtil = require('path');
const AWS = require('aws-sdk');
const config = require('./s3config.js');

AWS.config.accessKeyId = config.accessKeyId;
AWS.config.secretAccessKey = config.secretAccessKey;

const file = './images/Road.jpg';

var readStream = fs.createReadStream(file);

// 버킷 이름
var bucketName = 'hisasiburi';
// 버킷 내 객체 키 생성
var extname = pathUtil.extname(file); // 확장자
var now = new Date(); // 날짜를 이용한 파일 이름 생성
var itemKey = 'images/' + now.getHours() + now.getMinutes() + now.getSeconds() + Math.floor(Math.random()*1000) + extname;
var contentType = 'image/jpg'; // TODO : 파일에 따라서 컨텐츠 타입 설정

var params = {
   Bucket: bucketName,  // 필수
   Key: itemKey,			// 필수
   ACL: 'public-read',
   Body: readStream,
   ContentType: contentType
}

// s3 - Upload
var s3 = new AWS.S3();

s3.putObject(params, function (err, data) {
   if (err) {
      console.error('S3 PutObject Error', err);
      throw err;
   }
   // 접근 경로 - 2가지 방법
   var imageUrl = s3.endpoint.href + bucketName + '/' + itemKey; // http, https
   console.log('Image Upload Success : ', imageUrl);
});