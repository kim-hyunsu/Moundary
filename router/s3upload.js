const fs = require('fs');
const pathUtil = require('path');
var AWS = require('aws-sdk');
var s3 = new AWS.S3();
const im = require('imagemagick');
const config = require('./s3config.js');

class s3upload{};

AWS.config.accessKeyId = config.accessKeyId;
AwS.config.secretAccessKey = config.secretAccessKey;
const bucketName = 'moundary';

// folder : postImg, postThumbnail, profileImg, profileThumbnail, coverImg

// 원본 이미지 업로드 => callback(err, imageUrl)
s3upload.original = function(imageName, folder, date, userId, callback){
    const file = '../upload/'+imageName;
    const readStream = fs.createReadStream(file);
    const extname = pathUtil.extname(file);
    const itemKey = folder+'/'+date.year+date.month+date.date+date.hours
                    +date.minutes+date.seconds+'_'+userId+extname;
    const params = {
        Bucket : bucketName,
        Key : itemKey,
        ACL : 'pubic-read',
        Body : readStream
    }
    s3.putObject(params, (err, data)=>{
        if (err){
            return callback(err, null);
        }
        const path = 'http://' + s3.endpoint.host + '/' + bucketName + '/'+ itemKey;
        callback(null, path);
    });
}

//썸네일 이미지 변환 후 썸네일 업로드 => callback(err, imageUrl)
s3upload.thumbnail = function(imageName, folder, date, userId, callback){
    const file = '../upload' + imageName;
    const thumbnail = '../upload' + 'tumbnail_'+imageName;

    im.resize({
        srcPath : file,
        dstPath : tumbnail,
        // TODO-썸네일사이즈 결정하기//
        

        /////////////////////////////
    }, (err, stdout, stderr)=>{
        if (err){
            return callback(err, null);
        }
        const extname = pathUtil.extname(thumbnail);
        const itemKey = folder+'/'+date.year+date.month+date.date+date.hours
                        +date.minutes+date.seconds+'_'+userId+extname;
        const params = {
            Bucket : bucketName,
            Key : itemKey,
            ACL : 'pubic-read',
            Body : stdout
        }
        s3.putObject(params, (err, data)=>{
            if (err){
                return callback(err, null);
            }
            const path = 'http://' + s3.endpoint.host + '/' + bucketName + '/'+ itemKey;
            callback(null, path);
        });
    });
}

module.exports = s3upload;