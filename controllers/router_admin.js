var express = require('express');
var getRouter = express.Router();
var postRouter = express.Router();
var auth = require('./auth')
var Instructor = require('../models/instructor');


// add games to request
const getMasterGames = async (req, res, next) => {
    var games = await Instructor.getMasterGames();
    req.games = games;
    next();
}

// add participants to request
const getPairs = async (req, res, next) => {
    var pairs = await Instructor.getPairs();
    req.pairs = pairs;
    req.count = pairs.length;
    next();
}

// render the admin page
const renderAdmin = (req, res, next) => {
    res.render('admin', {
        games: req.games,
        pairs: req.pairs,
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
getRouter.get('/admin', getMasterGames);
getRouter.get('/admin', getPairs);
getRouter.get('/admin', renderAdmin);
getRouter.get('/admin', sendError);


// parse game data to numbers
const parseParams = (raw) => {
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
    return raw;
}

// format and check the received data of games
const checkParams = (req, res, next) => {
    var params = parseParams(req.body);
    for (var i in params){
        if (isNaN(params[i])){
            res.send("Input " + i + " is NaN!");
            return;
        } 
        if (i == 'alpha' || i == 'beta' || i == 'gamma') {
            if (params[i] < 0 || params[i] > 1) {
                res.send("Input " + i + " should be 0 ~ 1.");
                return;
            }
        } else if (i == 't') {
            if (params.t < 1 || params.t > 99) {
                res.send("Input T should be 1 ~ 99.");
                return;
            }
        } else if (i == 'w') {
            if (params.w < 0 || params.w >= 10000) {
                res.send("Input T should be 0 ~ 9999.");
                return;
            }
        } 
    }
    // req.param is a built-in function
    req.gameParams = params;
    next();
}

// add games and send the game data
const addGames = async (req, res, next) => {
    await Instructor.addMasterGame(req.gameParams);
    next()
}

const sendGames = (req, res, next) => {
    res.send({
        success: 1,
        games: req.games
    });
    next()
}

postRouter.post('/admin/add_games', checkParams);
postRouter.post('/admin/add_games', addGames);
postRouter.post('/admin/add_games', getMasterGames);
postRouter.post('/admin/add_games', sendGames);


// delete games and send the game data
const deleteMasterGame = async (req, res, next) => {
    await Instructor.deleteMasterGame(req.body.id);
    res.send({
        success: 1,
        id: req.body.id
    });
    next();

}

postRouter.post('/admin/delete_master_game', deleteMasterGame);


// check if valid number of participants to be added
const checkNumber = (req, res, next) => {
    var n = parseInt(req.body.n);
    if (n <= 0 || n > 100) {
        res.send("Please enter an number in 1~100!");
    }
    req.n = n;
    next();
}

// add participants and send the number that has been added
const addPairs = async (req, res, next) => {
    await Instructor.addPairs(req.n);
    next();
}

// send the updated participant table
const sendUpdatedPairs = (req, res, next) => {
    res.send({
        success: 1,
        pairs: req.pairs,
        count: req.count
    });
    next()
}

postRouter.post('/admin/add_pairs', checkNumber);
postRouter.post('/admin/add_pairs', addPairs);
postRouter.post('/admin/add_pairs', getPairs);
postRouter.post('/admin/add_pairs', sendUpdatedPairs);


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


// delete the pair
const deletePair = async (req, res, next) => {
    await Instructor.deletePair(req.body.first, req.body.second);
    next();
}

postRouter.post('/admin/delete_pair', deletePair);
postRouter.post('/admin/delete_pair', getPairs);
postRouter.post('/admin/delete_pair', sendUpdatedPairs);


// reset the pair
const resetPair = async (req, res, next) => {
    await Instructor.resetPair(req.body.first, req.body.second);
    req.body.id = req.body.first;
    next();
}

postRouter.post('/admin/reset_pair', resetPair);
postRouter.post('/admin/reset_pair', viewPair);


const downloadExcel = async (req, res, next) => {
    if (!auth.isInstructor(req.cookies)) {
        next();
        return;
    }
    var workbook = await Instructor.getExcel();
    workbook.write('ExcelFile.xlsx', res);
}

postRouter.get('/admin/download', downloadExcel)

postRouter.post('/admin*', sendError);

exports.get = getRouter;
exports.post = postRouter;