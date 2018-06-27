var express = require('express');
var getRouter = express.Router();
var postRouter = express.Router();


getRouter.get('/welcome', function(req, res, next){
    if (req.cookies.loggedIn) {
        res.render('welcome', {participantID: '1007'});
    } else {
        res.redirect('/login');
    }
});


exports.get = getRouter;
// exports.post = postRouter;