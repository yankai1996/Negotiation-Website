const express = require('express');
const getRouter = express.Router();
const postRouter = express.Router();
const auth = require('./auth');
const Assistant = require('../models/assistant');

const getStatus = async (req, res, next) => {
    var id = req.cookies.participant;
    var existFinished = await Assistant.existFinishedGames(id);
    var existUnfinished = await Assistant.existUnfinishedGames(id);
    if (existFinished && existUnfinished) {
        req.status = 2;
    } else if (existUnfinished) {
        req.status = 1;
    } else {
        req.status = 3;
    }
    next();
}

const checkPaused = async (req, res, next) => {
    var paused = await Assistant.isPaused();
    req.paused = paused;
    next();
}

// render the welcom page
const renderPlay = (req, res) => {
    res.render('play', {
        participantID: req.cookies.participant,
        flag: req.status,
        paused: req.paused
    });
}

getRouter.get('/play', auth.checkAuthParticipant);
getRouter.get('/play', getStatus);
getRouter.get('/play', checkPaused);
getRouter.get('/play', renderPlay);


const getSummary = async (req, res) => {
    var summary = await Assistant.getSummary(req.body.id);
    res.send({
        success: 1,
        summary: summary
    });
}

postRouter.post('/play/complete', getSummary);


exports.get = getRouter;
exports.post = postRouter;