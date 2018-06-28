const express = require('express');
const getRouter = express.Router();
const postRouter = express.Router();

const Instructor = require('../models/instructor');
const System = require('../models/system');


// check if the instructor has logged in
function checkAuth(req, res, next){
    if (!req.cookies.instructor) {
        res.redirect('/login')
    } else {
        next();
    }
}

// render admin page
function renderAdmin(req, res, next){
    Instructor.getGames().then(function(games){
        Instructor.countParticipants().then(function(number){
            res.render('admin', {
                games: games,
                participants: number
            });
        });
    }).catch(function(err){
        req.err = err;
        next();
    });
}

// send error message
function sendError(req, res){
    console.log(req.err);
    res.send("ERROR: " + req.err)
}

getRouter.get('/admin', checkAuth);
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



function deleteGames(req, res ,next){
    Instructor.deleteGames(req.game).then(function(result){
        res.send({
            success: 1,
            game: game
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

function addParticipants(req, res, next){
    Instructor.addParticipants(req.number).then(function(result){
        res.send({
            success: 1,
            number: result
        });
    }).catch(function(err){
        req.err = err;
        next();
    })
}

postRouter.post('/admin/add_participants', checkNumber);
postRouter.post('/admin/add_participants', addParticipants);
postRouter.post('/admin/add_participants', sendError);

exports.get = getRouter;
exports.post = postRouter;