const express = require('express');
const getRouter = express.Router();

getRouter.get('/logout', function(req, res){
    res.clearCookie("instructor");
    res.clearCookie("participant");
    res.redirect('/login');
});

exports.get = getRouter;