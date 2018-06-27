const express = require('express');
const getRouter = express.Router();
const postRouter = express.Router();

const Instructor = require('../models/instructor');
const System = require('../models/system');

function checkAuth(req, res, next){
    if (!req.cookies.instructor) {
        res.redirect('/login')
    } else {
        next();
    }
}

getRouter.get('/admin', checkAuth, function(req, res){
    // if (req.cookies.authorized) {
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
    // } else {
    //     res.redirect('/login');
    // }
});

postRouter.post('/admin/add_games', function(req, res){
    var game = System.parseGame(req.body);
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
    var game = System.parseGame(req.body);
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
    if (n <= 0 || n > 100) {
        res.send({
            errMsg: "Please enter an number in 1~100!"
        })
        return;
    }

    Instructor.addParticipants(n).then(function(result){
        res.send({
            success: 1,
            number: result
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