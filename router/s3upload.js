var AWS = require('aws-sdk');
const fs = require('fs');
const async = require('async');
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
s3upload.original = function(imagePath, imageType, folder, userId, callback){
    const date = new Date();
    const extname = pathUtil.extname(imagePath);
    if (extname.length == 0){
        console.log('No input image');
        return callback(null, null);
    }
    console.log('Uploading the image to s3 >>>', imagePath)
    var readStream = fs.createReadStream(imagePath);
    const itemKey = folder+'/'+date.getFullYear()+(date.getMonth()+1)+date.getDate()+date.getHours()
                    +date.getMinutes()+date.getSeconds()+'_'+userId+extname;
    const params = {
        Bucket : bucketName,
        Key : itemKey,
        ACL : 'public-read',
        Body : readStream,
        ContentType : imageType
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

// 썸네일 이미지 변환 후 썸네일 업로드 => callback(err, imageUrl)
s3upload.thumbnail = function(imagePath, imageType, folder, userId, callback){
    const date = new Date();
    const extname = pathUtil.extname(imagePath);
    if (extname.length == 0){
        return callback(null, null);
    }
    const thumbnail = __dirname+"/../upload/thumb_" +pathUtil.basename(imagePath);
    console.log('Check Thumbnail Path >>>', thumbnail);
    im.resize({
        srcPath : imagePath,
        dstPath : thumbnail,
        width : 339
    },(err, stdout, stderr)=>{
            if (err){
                fs.unlink(thumbnail, (err)=>{
                    if (err){
                        console.log('Fail to delete a temporary thumbnail file >>>', thumbnail);
                    }
                    else{
                        console.log('Removed the temporary thumbanil file');
                    }
                    return callback(err, null);
                });
                console.log('BUG');
            }
            console.log('The image resized');
            var readStream = fs.createReadStream(thumbnail);
            const itemKey = folder+'/'+date.getFullYear()+(date.getMonth()+1)+date.getDate()+date.getHours()
                        +date.getMinutes()+date.getSeconds()+'_'+userId+extname;
            const params = {
                Bucket : bucketName,
                Key : itemKey,
                ACL : 'public-read',
                Body : readStream,
                ContentType : imageType
            }
            s3.putObject(params, (err, data)=>{
                if (err){
                    return callback(err, null);
                }
                const path = 'http://' + s3.endpoint.host + '/' + bucketName + '/'+ itemKey;
                console.log('The thumbnail uploading complete >>>', path);
                callback(null, path);
            });
        });
    }

// s3 이미지 파일 삭제
s3upload.delete = function(url, callback){
    if (!url){
        callback(null,null);
    }
    const params = {
        Bucket : bucketName,
        Key : url.replace("http://s3.ap-northeast-2.amazonaws.com/"+bucketName+"/", "")
    }
    s3.deleteObject(params, (err, data)=>{
        if (err){
            return callback(err, null);
        }
        callback(null,null);
    });
}

// upload original image to s3 and then upload thumbanailed image to s3.
s3upload.originalAndThumbnail = function(imagePath, imageType, folder, userId, callback){
    const date = new Date();
    const extname = pathUtil.extname(imagePath);
    if (extname.length == 0){
        return callback(null, null, null);
    }
    async.parallel([
        function(cb){
            var readStream = fs.createReadStream(imagePath);
            const itemKey = folder+'/'+date.getFullYear()+(date.getMonth()+1)+date.getDate()+date.getHours()
                            +date.getMinutes()+date.getSeconds()+'_'+userId+extname;
            const params = {
                Bucket : bucketName,
                Key : itemKey,
                ACL : 'public-read',
                Body : readStream,
                ContentType : imageType
            }
            s3.putObject(params, (err, data)=>{
                if (err){
                    return cb(err, null);
                }
                const path = 'http://' + s3.endpoint.host + '/' + bucketName + '/'+ itemKey;
                console.log('Upload Complete >>>', path);
                cb(null, path);   
            });
        },
        function(cb){
            const thumbnail = __dirname+"/../upload/thumb_" +pathUtil.basename(imagePath);
            console.log('Check Thumbnail Path >>>', thumbnail);
            im.resize({
                srcPath : imagePath,
                dstPath : thumbnail,
                width : 339
            },(err, stdout, stderr)=>{
                    if (err){
                        cb(err, null);
                    }
                    console.log('The image resized');
                    var readStream = fs.createReadStream(thumbnail);
                    const itemKey = folder.replace('Img', 'Thumbnail')+'/'+date.getFullYear()+(date.getMonth()+1)+date.getDate()+date.getHours()
                                +date.getMinutes()+date.getSeconds()+'_'+userId+extname;
                    const params = {
                        Bucket : bucketName,
                        Key : itemKey,
                        ACL : 'public-read',
                        Body : readStream,
                        ContentType : imageType
                    }
                    s3.putObject(params, (err, data)=>{
                        if (err){
                            return cb(err, null);
                        }
                        const path = 'http://' + s3.endpoint.host + '/' + bucketName + '/'+ itemKey;
                        console.log('The thumbnail uploading complete >>>', path);
                        cb(null, path);
                    });
                });
        }
    ], (err, paths)=>{
        if (err){
            return callback(err, null, null);
        }
        callback(null, paths[0], paths[1]);
    });
}



module.exports = s3upload;
