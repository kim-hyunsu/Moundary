const express = require('express');
const router = express.Router();
const Post = require('../model/posts.js');

// 동네소식 목록, 정보글 쓰기
router.route('/info')
    .get(infoList)
    .post(writeInfo);

// 정보글 상세페이지, 정보글 수정, 정보글 삭제
router.route('/info/detail')
    .get(infoDetail)
    .put(modifyInfo)
    .delete(deleteInfo);

// 정보글 좋아요
router.put('/post/like', likeInfo);

function infoList(req, res, next){
    var postAddress = req.query;
    const category = postAddress.category;
    const endPost = postAddress.endPost;
    const userId = req.query.userId;
    delete postAdress.category;
    delete postAddress.endPost;
    delete postAddress.userId;

    if (Object.keys(postAddress).length == 0){
        Post.getInfoPostsNearby(endPost, userId, category, count, (err, results)=>{
            if (err){
                return next(err);
            }
            const myAddress = results.userAddress;
            delete results.userAddress;
            const data = {
                msg : 'success',
                myAddress : myAddress,
                page : {
                    postCount : results.length,
                    endPost : results[0]._id
                },
                data : results
            }
            res.json(data);
        });
    }
    else{
        Post.getInfoPostsByAddress(endPost, postAddress, category, count, (err, results)=>{
            if (err){
                return next(err);
            }
            const data = {
                msg : 'success',
                page : {
                    postCount : results.length,
                    endPost : results[0]._id
                },
                data : results
            }
            res.json(data);
        });
    }
}

function writeInfo(req, res, next){
    const now = new Date();
    const userId = req.query.userId;
    const post = req.body;
    const postImg = req.body.postImg;
    delete post.postImg;
    s3upload.original(postImg.path, 'postImg', now, userId, (err, imageUrl)=>{
        if(err){
            fs.unlink(postImg.path, (err)=>{
                if (err){
                    console.log('fail to delete the empty image >>>', postImg.path);
                }
                else{
                    console.log('Deleted a empty image');
                }
                return next(err);
            });
        }
        post.postImg = imageUrl;
        s3upload.thumbnail(postImg.path, 'postThumbnail', now, userId, (err, imageUrl)=>{
            if(err){
                const thumbnailPath = __dirname+'/../upload' + 'thumbnail_'+pathUtil.basename(image.path)
                fs.unlink(thumbnailPath, (err)=>{
                    if (err){
                        console.log('fail to delete the empty image >>>', thumbnailPath);
                    }
                    else{
                        console.log('Deleted a empty image');
                    }
                    return next(err);
                });
            }
            post.postThumbnail = imageUrl;
            post.userId = post.userId;
            post.postDate = now;
            post.postLikeUsers = [];
            post.replyCount = 0;
            post.reply =[];
            Post.recordPost(post, (err, postId)=>{
                if (err){
                    return next(err);
                }
                fs.unlink(postImg.path, (err)=>{
                    if (err){
                        console.log('Fail to delete a temporary file >>>', postImg.path)
                    }
                    else{
                        console.log('Removed the temporary image of the post');
                    }
                    fs.unlink(thumbnailPath, (err)=>{
                        if (err){
                            console.log('Fail to delete a temporary thumbnail file >>>', thumbnailPath);
                        }
                        else{
                            console.log('Removed the temporary thumbnail image of the post')
                        }
                        const data = {
                            msg : 'success',
                            postId : postId.toString()
                        }
                        res.json(data);
                    })
                })
            });
        });
    });

}

function infoDetail(req, res, next){
    const postId = req.query.postId;
    Post.getDetail(postId, (err, results)=>{
        if (err){
            return next(err);
        }
        const data = {
            msg : 'success',
            postInfo : results
        }
        res.json(data);
    });

}

function modifyInfo(req, res, next){

}

function deleteInfo(req, res, next){

}

function likeInfo(req, res, next){
    
}

module.exports = router;