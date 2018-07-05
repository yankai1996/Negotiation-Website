var express = require('express');
var getRouter = express.Router();
var postRouter = express.Router();
var auth = require('./auth')
var Instructor = require('../models/instructor');


// add games to request
const getGames = async (req, res, next) => {
    var games = await Instructor.getGames();
    req.games = games;
    next();
}

// add participants to request
const getParticipants = async (req, res, next) => {
    var participants = await Instructor.getPairedParticipants();
    req.participants = participants;
    req.count = await Instructor.countParticipants();
    next();
}

// render the admin page
const renderAdmin = (req, res, next) => {
    res.render('admin', {
        games: req.games,
        participants: req.participants,
        count: req.count
    });
    next();
}

// send error message
const sendError = (req, res) => {
    if (!res.headersSent) {
        res.send("ERROR: Your request cannot be handled properly!");
    }
}

getRouter.get('/admin', auth.checkAuthInstructor);
getRouter.get('/admin', getGames);
getRouter.get('/admin', getParticipants);
getRouter.get('/admin', renderAdmin);
getRouter.get('/admin', sendError);


// parse game data to numbers
const parseGame = (raw) => {
    for (var key in raw) {
        var temp;
        if (key == 't' || key == 'n'){
            temp = parseInt(raw[key]);
        } else {
            temp = parseFloat(raw[key]);
            if (temp) {
                temp = parseFloat(temp.toFixed(2))
            }
        }
        raw[key] = temp;
    }
    return {
        alpha: raw.alpha,
        beta:  raw.beta,
        gamma: raw.gamma,
        t:     raw.t,
        w:     raw.w,
        n:     raw.n 
    }
}

// format and check the received data of games
const checkGameData = (req, res, next) => {
    var game = parseGame(req.body);
    for (var i in game){
        if (isNaN(game[i])){
            res.send("Input " + i + " is NaN!");
            return;
        } 
        if (i == 'alpha' || i == 'beta' || i == 'gamma') {
            if (game[i] < 0 || game[i] > 1) {
                res.send("Input " + i + " should be 0 ~ 1.");
                return;
            }
        } else if (game.t < 1 || game.t > 99) {
            res.send("Input T should be 1 ~ 99.");
            return;
        } else if (game.w < 0 || game.w >= 10000) {
            res.send("Input T should be 0 ~ 9999.");
            return;
        } else if (game.n > 1000) {
            res.send("Please try a smaller n.");
            return;
        }
    }
    req.game = game;
    next();
}

// add games and send the game data
const addGames = async (req, res, next) => {
    await Instructor.addGames(req.game);
    next()
}

const sendGames = (req, res, next) => {
    res.send({
        success: 1,
        games: req.games
    });
    next()
}

postRouter.post('/admin/add_games', checkGameData);
postRouter.post('/admin/add_games', addGames);
postRouter.post('/admin/add_games', getGames);
postRouter.post('/admin/add_games', sendGames);
postRouter.post('/admin/add_games', sendError);


// delete games and send the game data
const deleteGames = async (req, res, next) => {
    await Instructor.deleteGames(req.game);
    res.send({
        success: 1,
        game: req.game
    });
    next();

}

postRouter.post('/admin/delete_games', checkGameData);
postRouter.post('/admin/delete_games', deleteGames);
postRouter.post('/admin/delete_games', sendError);


// check if valid number of participants to be added
const checkNumber = (req, res, next) => {
    var number = parseInt(req.body.number);
    if (number <= 0 || number > 100) {
        res.send("Please enter an number in 1~100!");
    }
    req.number = number;
    next();
}

// add participants and send the number that has been added
const addParticipants = async (req, res, next) => {
    await Instructor.addParticipants(req.number);
    next();
}

// send the updated participant table
const sendUpdatedParticipants = (req, res, next) => {
    res.send({
        success: 1,
        participants: req.participants,
        count: req.count
    });
    next()
}

postRouter.post('/admin/add_participants', checkNumber);
postRouter.post('/admin/add_participants', addParticipants);
postRouter.post('/admin/add_participants', getParticipants);
postRouter.post('/admin/add_participants', sendUpdatedParticipants);
postRouter.post('/admin/add_participants', sendError);


// get and send games according to participant id
const viewPair = async (req, res, next) => {
    var games = await Instructor.getGamesByParticipant(req.body.id);
    res.send({
        success: 1,
        games: games
    });
    next();
}

postRouter.post('/admin/view_pair', viewPair);
postRouter.post('/admin/view_pair', sendError);


// remove game from pair
const removeGame = async (req, res, next) => {
    await Instructor.removePairFromGame(req.body.gameId);
    req.body.id = req.body.buyerId
    next();
}

postRouter.post('/admin/remove_game', removeGame);
postRouter.post('/admin/remove_game', viewPair);
postRouter.post('/admin/remove_game', sendError);


const getAvalibaleGames = async (req, res, next) => {
    var games = await Instructor.getAvailableGames();
    res.send({
        success: 1,
        games: games
    });
    next();
}

postRouter.post('/admin/get_available_games', getAvalibaleGames);
postRouter.post('/admin/get_available_games', sendError);


const assignGamesToPair = async (req, res, next) => {
    var games = JSON.parse(req.body.gamesString);
    await Instructor.assignGamesToPair(games);
    res.send({
        success: 1,
    });
    next();

}

postRouter.post('/admin/assign_games_to_pair', assignGamesToPair);
postRouter.post('/admin/assign_games_to_pair', sendError);

exports.get = getRouter;
exports.post = postRouter;