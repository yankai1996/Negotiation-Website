var express = require('express');
var participant = require('../models/participant')
var getRouter = express.Router();
var postRouter = express.Router();


getRouter.get('/', function(req, res){
    res.redirect('/login');
});

getRouter.get('/login', function(req, res, next){
    res.render('login', {flag: 0});
});


postRouter.post('/login', function(req, res){
    if (req.body.username == 'hello' && req.body.password == 'world') {
        res.cookie('authorized', req.body.username);
        res.redirect('/admin');
    } else {
        res.render('login', {flag: 1});
    }
});

exports.get = getRouter;
exports.post = postRouter;