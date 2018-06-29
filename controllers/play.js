const express = require('express');
const getRouter = express.Router();
const postRouter = express.Router();
const auth = require('./auth')

// render the welcom page
function renderWelcome(req, res) {
    res.render('welcome', {
        participantID: req.cookies.participant
    });
}

getRouter.get('/welcome', auth.checkAuthParticipant);
getRouter.get('/welcome', renderWelcome);


exports.get = getRouter;
// exports.post = postRouter;