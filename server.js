const express = require('express');
const app = express();

app.use((req, res)=>{
    res.send({mag:'Hello Linux'});
});

app.listen(80);