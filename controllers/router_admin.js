var express = require('express');
var getRouter = express.Router();
var postRouter = express.Router();
var auth = require('./auth')

var Instructor = require('../models/instructor');
var System = require('../models/system');


// add games to request
const getGames = (req, res, next) => {
    Instructor.getGames().then((games) => {
        req.games = games;
        next();
    }).catch((err) => {
        req.err = err;
        sendError(req, res);
    });
}

// add participants to request
const getParticipants = (req, res, next) => {
    Instructor.getPairedParticipants().then((participants) => {
        req.participants = participants;
        next();
    }).catch((err) => {
        req.err = err;
        sendError(req, res);
    });
}

const countParticipants = (req, res, next) => {
    Instructor.countParticipants().then((count) => {
        req.count = count;
        next();
    }).catch((err) => {
        req.err = err;
        sendError(req, res);
    });
}

// render the admin page
const renderAdmin = (req, res, next) => {
    try {
        res.render('admin', {
            games: req.games,
            participants: req.participants,
            count: req.count
        });
    } catch (error) {
        req.err = error;
        next();
    }
}

// send error message
const sendError = (req, res) => {
    console.log(req.err);
    res.send("ERROR: " + req.err)
}

getRouter.get('/admin', auth.checkAuthInstructor);
getRouter.get('/admin', getGames);
getRouter.get('/admin', getParticipants);
getRouter.get('/admin', countParticipants);
getRouter.get('/admin', renderAdmin);
getRouter.get('/admin', sendError);


// format and check the received data of games
const checkGameData = (req, res, next) => {
    var game = System.parseGame(req.body);
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
const addGames = (req, res, next) => {
    Instructor.addGames(req.game).then((result) => {
        next();
    }).catch((err) => {
        req.err = err;
        sendError()
    }); 
}

const sendGames = (req, res, next) => {
    try {
        res.send({
            success: 1,
            games: req.games
        });
    } catch (err) {
        req.err = err;
        next()
    }
}

postRouter.post('/admin/add_games', checkGameData);
postRouter.post('/admin/add_games', addGames);
postRouter.post('/admin/add_games', getGames);
postRouter.post('/admin/add_games', sendGames);
postRouter.post('/admin/add_games', sendError);


// delete games and send the game data
const deleteGames = (req, res, next) => {
    Instructor.deleteGames(req.game).then((result) => {
        res.send({
            success: 1,
            game: req.game
        });
    }).catch((err) => {
        req.err = err;
        next();
    });
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
const addParticipants = (req, res, next) => {
    Instructor.addParticipants(req.number).then((result) => {
        next()
    }).catch((err) => {
        req.err = err;
        sendError(req, res);
    })
}

// send the updated participant table
const sendUpdatedParticipants = (req, res, next) => {
    try {
        res.send({
            success: 1,
            participants: req.participants,
            count: req.count
        });
    } catch (error) {
        req.err = err;
        next()
    }
}

postRouter.post('/admin/add_participants', checkNumber);
postRouter.post('/admin/add_participants', addParticipants);
postRouter.post('/admin/add_participants', getParticipants);
postRouter.post('/admin/add_participants', countParticipants);
postRouter.post('/admin/add_participants', sendUpdatedParticipants);
postRouter.post('/admin/add_participants', sendError);


// get and send games according to participant id
const viewPair = (req, res, next) => {
    // console.log(req.body.id);
    Instructor.getGamesByParticipant(req.body.id).then((result) => {
        res.send({
            success: 1,
            games: result
        });
    }).catch((err) => {
        req.err = err;
        next();
    });
}

postRouter.post('/admin/view_pair', viewPair);
postRouter.post('/admin/view_pair', sendError);


// remove game from pair
const removeGame = (req, res, next) => {
    Instructor.removePairFromGame(req.body.gameId).then((result) => {
        // pass request to viewPair()
        req.body.id = req.body.buyerId
        next();
    }).catch((err) => {
        req.err = err;
        sendError(req, res);
    });
}

postRouter.post('/admin/remove_game', removeGame);
postRouter.post('/admin/remove_game', viewPair);
postRouter.post('/admin/remove_game', sendError);


const getAvalibaleGames = (req, res, next) => {
    Instructor.getAvailableGames().then((games) => {
        res.send({
            success: 1,
            games: games
        });
    }).catch((err) => {
        req.err = err;
        next();
    });
}

postRouter.post('/admin/get_available_games', getAvalibaleGames);
postRouter.post('/admin/get_available_games', sendError);


const assignGamesToPair = (req, res, next) => {
    var games = JSON.parse(req.body.gamesString);
    Instructor.assignGamesToPair(games).then(games => {
        res.send({
            success: 1,
        });
    }).catch(err => {
        req.err = err;
        next()
    });
}

postRouter.post('/admin/assign_games_to_pair', assignGamesToPair);
postRouter.post('/admin/assign_games_to_pair', sendError);

exports.get = getRouter;
exports.post = postRouter;