const express = require('express');
const getRouter = express.Router();
const postRouter = express.Router();
const auth = require('./auth')

const Instructor = require('../models/instructor');
const System = require('../models/system');


// add games to request
function getGames(req, res, next){
    Instructor.getGames().then(function(games){
        req.games = games;
        next();
    }).catch(function(err){
        req.err = err;
        sendError(req, res);
    });
}

// add participants to request
function getParticipants(req, res, next){
    Instructor.getParticipants().then(function(participants){
        req.participants = participants;
        next();
    }).catch(function(err){
        req.err = err;
        sendError(req, res);
    })
}

// render the admin page
function renderAdmin(req, res, next){
    try {
        res.render('admin', {
            games: req.games,
            participants: req.participants
        });
    } catch (error) {
        req.err = error;
        next();
    }
}

// send error message
function sendError(req, res){
    console.log(req.err);
    res.send("ERROR: " + req.err)
}

getRouter.get('/admin', auth.checkAuthInstructor);
getRouter.get('/admin', getGames);
getRouter.get('/admin', getParticipants);
getRouter.get('/admin', renderAdmin);
getRouter.get('/admin', sendError);


// format and check the received data of games
function checkGameData(req, res, next){
    var game = System.parseGame(req.body);
    for (var i in game){
        if (isNaN(game[i])){
            res.send({
                errMsg: "Input " + i + " is NaN!"
            });
        } 
    }
    req.game = game;
    next();
}

// add games and send the game data
function addGames(req, res, next){
    Instructor.addGames(req.game).then(function(result){
        res.send({
            success: 1,
            game: result
        });
    }).catch(function(err){
        req.err = err;
        next();
    }); 
}

postRouter.post('/admin/add_games', checkGameData);
postRouter.post('/admin/add_games', addGames);
postRouter.post('/admin/add_games', sendError);


// delete games and send the game data
function deleteGames(req, res, next){
    Instructor.deleteGames(req.game).then(function(result){
        res.send({
            success: 1,
            game: req.game
        });
    }).catch(function(err){
        req.err = err;
        next();
    });
}

postRouter.post('/admin/delete_games', checkGameData);
postRouter.post('/admin/delete_games', deleteGames);
postRouter.post('/admin/delete_games', sendError);


// check if valid number of participants to be added
function checkNumber(req, res, next){
    var number = parseInt(req.body.number);
    if (number <= 0 || number > 100) {
        res.send("Please enter an number in 1~100!");
    }
    req.number = number;
    next();
}

// add participants and send the number that has been added
function addParticipants(req, res, next){
    Instructor.addParticipants(req.number).then(function(result){
        next()
    }).catch(function(err){
        req.err = err;
        sendError(req, res);
    })
}

// send the updated participant table
function sendUpdatedParticipants(req, res, next){
    try {
        res.send({
            success: 1,
            participants: req.participants
        });
    } catch (error) {
        req.err = err;
        next()
    }
}

postRouter.post('/admin/add_participants', checkNumber);
postRouter.post('/admin/add_participants', addParticipants);
postRouter.post('/admin/add_participants', getParticipants);
postRouter.post('/admin/add_participants', sendUpdatedParticipants);
postRouter.post('/admin/add_participants', sendError);


exports.get = getRouter;
exports.post = postRouter;