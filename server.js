const  express = require('express');
const app = express();

app.use((req, res)=>{
    res.send({mag:'Hello World'});
});

app.listen(3000);
