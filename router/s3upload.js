var AWS = require('aws-sdk');
const fs = require('fs');
const config = require('./s3config.js');
AWS.config.region = 'ap-northeast-2';
AWS.config.accessKeyId = config.accessKeyId;
AWS.config.secretAccessKey = config.secretAccessKey;
var s3 = new AWS.S3();
const im = require('imagemagick');
const pathUtil = require('path');
 

class s3upload{};
const bucketName = 'moundary';

// folder : postImg, postThumbnail, profileImg, profileThumbnail, coverImg

// 원본 이미지 업로드 => callback(err, imageUrl)
s3upload.original = function(image, folder, date, userId, callback){
    if (!image && image.size>0){
        return callback(null, null);
    }
    console.log('Uploading the image to s3 >>>', image.path)
    var readStream = fs.createReadStream(image.path);
    const extname = pathUtil.extname(image.path);
    const itemKey = folder+'/'+date.getFullYear()+(date.getMonth()+1)+date.getDate()+date.getHours()
                    +date.getMinutes()+date.getSeconds()+'_'+userId+extname;
    const params = {
        Bucket : bucketName,
        Key : itemKey,
        ACL : 'public-read',
        Body : readStream,
        ContentType : readStream.ContentType
    }
    s3.putObject(params, (err, data)=>{
        if (err){
            return callback(err, null);
        }
        const path = 'http://' + s3.endpoint.host + '/' + bucketName + '/'+ itemKey;
        console.log('Upload Complete >>>', path);
        callback(null, path);   
    });
}

//썸네일 이미지 변환 후 썸네일 업로드 => callback(err, imageUrl)
s3upload.thumbnail = function(image, folder, date, userId, callback){
    if (!image && image.size>0){
        return callback(null, null);
    }
    const thumbnail = __dirname+'/../upload' + 'thumbnail_'+pathUtil.basename(image.path);

    im.resize({
        srcPath : image.path,
        dstPath : thumbnail,
        // TODO-썸네일사이즈 결정하기//
        

        /////////////////////////////
    }, (err, stdout, stderr)=>{
        if (err){
            return callback(err, null);
        }
        const itemKey = folder+'/'+date.getFullYear()+(date.getMonth()+1)+date.getDate()+date.getHours()
                    +date.getMinutes()+date.getSeconds()+'_'+userId+extname;
        const params = {
            Bucket : bucketName,
            Key : itemKey,
            ACL : 'public-read',
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