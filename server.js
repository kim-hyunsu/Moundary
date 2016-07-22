const AWS = require('aws-sdk');
const config = require('./s3config.js');

AWS.config.accessKeyId = config.accessKeyId;
AWS.config.secretAccessKey = config.secretAccessKey;

const s3 = new AWS.S3();

console.log('endpoint : ', s3.endpoint);
console.log('href', s3.endpoint.href);

const bucketName ='hisasiburi';
s3.listObjects({Bucket: bucketName}, (err,data)=>{
    console.log('== List Object');
    if(err){
        console.error('S3 listObjects Error', err);
        throw err;
    }
    const items = data.Contents;
    items.forEach((item)=>{
        const path1 = s3.endpoint.href + '/' + bucketName + '/' + item.Key;
        const path2 = 'http://' + s3.endpoint.host + '/' + bucketName + '/' + item.Key;
        console.log('HTTPS url :', path1);
        console.log('HTTP url :', path2);
    });
});


const key = 'images/road.jpg';
s3.headObject({Bucket:bucketName, Key:key}, (err, data)=>{
    console.log('== headObject');
    if(err && err.statusCode == 404 ){
        console.log('Not Found');
    }
    else if( err ){
        console.error('headObject Error', err);
    }
    else{
        console.log('Exist, Metadata', data);
    }
});