const express = require('express');
const getRouter = express.Router();
const postRouter = express.Router();
const auth = require('./auth');
const Dealer = require('../models/dealer');

const getStatus = async (req, res, next) => {
    var id = req.cookies.participant;
    var existFinished = await Dealer.existFinishedGames(id);
    var existUnfinished = await Dealer.existUnfinishedGames(id);
    if (existFinished && existUnfinished) {
        req.status = 2;
    } else if (existUnfinished) {
        req.status = 1;
    } else {
        req.status = 3;
    }
    next();
}


// render the welcom page
const renderPlay = (req, res) => {
    res.render('play', {
        participantID: req.cookies.participant,
        // flag: req.status
        flag: 2
    });
}

getRouter.get('/play', auth.checkAuthParticipant);
getRouter.get('/play', getStatus);
getRouter.get('/play', renderPlay);

exports.get = getRouter;
// exports.post = postRouter;