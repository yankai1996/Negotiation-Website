const express = require('express');
const getRouter = express.Router();
const postRouter = express.Router();
const auth = require('./auth');

// root url
getRouter.get('/', auth.checkAuth);
getRouter.get('/', function(req, res){
    res.redirect('/login');
});

getRouter.get('/login', function(req, res){
    res.render('login', {flag: 0});
});

postRouter.post('/login', auth.authInstructor);
postRouter.post('/login', auth.authParticipant);
postRouter.post('/login', auth.authFail);

// log out
getRouter.get('/logout', function(req, res){
    res.clearCookie("instructor");
    res.clearCookie("participant");
    res.redirect('/login');
});


exports.get = getRouter;
exports.post = postRouter;