const express = require('express');
const getRouter = express.Router();
const postRouter = express.Router();
const auth = require('./auth')

// render the welcom page
function renderWelcome(req, res) {
    res.render('play', {
        participantID: req.cookies.participant
    });
}

getRouter.get('/play', auth.checkAuthParticipant);
getRouter.get('/play', renderWelcome);


exports.get = getRouter;
// exports.post = postRouter;