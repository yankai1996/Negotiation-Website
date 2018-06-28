const express = require('express');
const getRouter = express.Router();
const postRouter = express.Router();
const System = require('../models/system');

getRouter.get('/', function(req, res){
    res.redirect('/login');
});

getRouter.get('/login', function(req, res){
    res.render('login', {flag: 0});
});

// authentication of instructor
function authInstructor(req, res, next){
    let username = req.body.username,
        password = req.body.password;
    if (System.verifyInstructor(username, password)) {
        res.cookie('instructor', username);
        res.redirect('/admin');
    } else {
        next();
    }
}

// authentication of participant
function authParticipant(req, res, next){
    let username = req.body.username,
        password = req.body.password;
    System.verifyParticipant(username, password).then(function(verified){
        if (verified) {
            res.cookie('participant', username);
            res.redirect('/welcome');
        } else {
            next()
        }
    }).catch(function(error){
        console.log(error);
        next()
    });
}

// set log-in failure flag
function authFail(req, res) {
    res.render('login', {flag: 1});
}

postRouter.post('/login', authInstructor);
postRouter.post('/login', authParticipant);
postRouter.post('/login', authFail);



exports.get = getRouter;
exports.post = postRouter;