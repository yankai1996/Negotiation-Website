// Authentication middelwares

const System = require('../models/system');

// authentication of instructor
exports.authInstructor = function(req, res, next){
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
exports.authParticipant = function(req, res, next){
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

// check if the instructor has logged in
exports.checkAuthInstructor = function(req, res, next){
    if (!req.cookies.instructor) {
        res.redirect('/login');
    } else {
        next();
    }
}

// check if the participant has logged in
exports.checkAuthParticipant = function(req, res, next) {
    if (!req.cookies.participant) {
        res.redirect('/login')
    } else {
        next();
    }
}

exports.checkAuth = function(req, res, next){
    if (req.cookies.instructor) {
        res.redirect('/admin');
    } else if (req.cookies.participant) {
        res.redirect('/welcome');
    } else {
        next()
    }
}

// set log-in failure flag
exports.authFail = function(req, res) {
    res.render('login', {flag: 1});
}
