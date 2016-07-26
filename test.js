const express = require('express');
const app = express();

app.post('/reply', (req, res)=>{
    const postId = req.query.postId;
    console.log(postId);
});

app.listen(3000);