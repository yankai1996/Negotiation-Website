var express = require('express');
var getRouter = express.Router();
var postRouter = express.Router();


// check if the participant has logged in
function checkAuth(req, res, next) {
    if (!req.cookies.participant) {
        res.redirect('/login')
    } else {
        next();
    }
}

// render the welcom page
function renderWelcome(req, res) {
    res.render('welcome', {
        participantID: req.cookies.participant
    });
}

getRouter.get('/welcome', checkAuth);
getRouter.get('/welcome', renderWelcome);


exports.get = getRouter;
// exports.post = postRouter;