'use strict';

var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var login  = require('./controllers/login');
var admin  = require('./controllers/router_admin');
var play   = require('./controllers/router_play');

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
app.use(admin.post);
app.use(play.get);

app.listen(8888, function(){
    console.log("App is running on port 8888!")
});