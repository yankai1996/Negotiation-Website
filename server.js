'use strict';

var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var login = require('./routers/login');
var admin = require('./routers/admin');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(login.get);
app.use(login.post);
app.use(admin.get);

// app.use(function(req, res){
//     console.log('404 '+req.url);
//     res.writeHead(404);
//     res.end('404 Not Found');
// });

app.listen(8888, function(){
    console.log("App is running on port 8888!")
});