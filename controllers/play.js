var express = require('express');
var getRouter = express.Router();
var postRouter = express.Router();

function checkAuth(req, res, next){
    if (!req.cookies.participant) {
        res.redirect('/login')
    } else {
        next();
    }
}

getRouter.get('/welcome', checkAuth, function(req, res, next){
    res.render('welcome', {participantID: req.cookies.participant});
});


exports.get = getRouter;
// exports.post = postRouter;