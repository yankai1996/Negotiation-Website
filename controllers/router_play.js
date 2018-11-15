const express = require('express');
const getRouter = express.Router();
const auth = require('./auth');
const Assistant = require('../models/assistant');
const defaultParams = require('../config').defaultParams;
const money = require('../config').money;

const getStatus = async (req, res, next) => {
    var id = auth.getParticipantID(req.cookies);
    var existFinished = await Assistant.existFinishedGames(id);
    var existUnfinished = await Assistant.existUnfinishedGames(id);
    if (existUnfinished) {
        req.status = existFinished ? 2 : 1;
        next();
    } else {
        res.redirect('/play/complete')
    }
}

const checkPaused = async (req, res, next) => {
    var paused = await Assistant.isPaused();
    req.paused = paused;
    next();
}

// render the welcom page
const renderPlay = (req, res) => {
    res.render('play', {
        participantID: auth.getParticipantID(req.cookies),
        flag: req.status,
        paused: req.paused
    });
}

getRouter.get('/play', auth.checkAuthParticipant);
getRouter.get('/play', getStatus);
getRouter.get('/play', checkPaused);
getRouter.get('/play', renderPlay);


const renderDescription = (req, res) => {
    res.render('description', {
        defaultParams: defaultParams,
        money: money
    });
}

getRouter.get('/play/description', auth.checkAuthParticipant);
getRouter.get('/play/description', renderDescription);


const complete = async (req, res) => {
    var id = auth.getParticipantID(req.cookies);
    var existUnfinished = await Assistant.existUnfinishedGames(id);
    if (existUnfinished) {
        res.redirect('/play');
    } else {
        var summary = await Assistant.getSummary(id);
        res.render('play_complete', {
            participantID: id,
            summary: summary,
            basePayment: money.basePayment
        })
    }
}

getRouter.get('/play/complete', auth.checkAuthParticipant);
getRouter.get('/play/complete', complete);


exports.get = getRouter;