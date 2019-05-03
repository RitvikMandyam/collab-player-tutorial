var express = require('express');
var app = express();
var port = 3000;

app.get('/', (req, res) =>  res.sendFile(__dirname + '/public/index.html'));

app.listen(port, '0.0.0.0');
