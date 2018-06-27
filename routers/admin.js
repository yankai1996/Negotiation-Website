var express = require('express');
var getRouter = express.Router();
var postRouter = express.Router();

var Instructor = require('../models/instructor')

getRouter.get('/admin', function (req, res) {
    if (req.cookies.authorized) {
        Instructor.getGames().then(function(games){
            Instructor.countParticipants().then(function(number){
                res.render('admin', {
                    games: games,
                    participants: number
                });
            }).catch(function(err){
                console.log(err);
                res.send(err);
            });
        }).catch(function(err){
            console.log(err);
            res.send(err);
        });
    } else {
        res.redirect('/login');
    }
});

postRouter.post('/admin/add_games', function(req, res){
    var game = Instructor.parseInput(req.body);
    for (var i in game){
        if (isNaN(game[i])){
            res.send({
                errMsg: 'Input "'+i+'" is NaN!'
            });
            return;
        } 
    }
    Instructor.addGames(game).then(function(result){
        res.send({
            success: 1,
            game: result
        });
    }).catch(function(err){
        console.log(err);
        res.send({
            errMsg: err
        });
    });  
});

postRouter.post('/admin/delete_games', function(req, res){
    var game = Instructor.parseInput(req.body);
    Instructor.deleteGames(game).then(function(result){
        res.send({
            success: 1,
            game: game
        });
    }).catch(function(err){
        console.log(err);
        res.send({
            errMsg: err
        });
    });
});

postRouter.post('/admin/add_participants', function(req, res){
    var n = parseInt(req.body.n);

    Instructor.countParticipants().then(function(number){
        res.send({
            success: 1,
            number: number
        });
    }).catch(function(err){
        console.log(err);
        res.send({
            errMsg: err
        })
    })
});

exports.get = getRouter;
exports.post = postRouter;