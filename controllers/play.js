var express = require('express');
var getRouter = express.Router();
var postRouter = express.Router();


getRouter.get('/welcome', function(req, res, next){
    res.render('welcome', {participantID: '1007'});
});


exports.get = getRouter;
// exports.post = postRouter;