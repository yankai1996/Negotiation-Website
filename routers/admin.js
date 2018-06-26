var express = require('express');
var getRouter = express.Router();
var postRouter = express.Router();

var Instructor = require('../models/instructor')

getRouter.get('/admin', function (req, res) {
    if (req.cookies.authorized) {
        Instructor.getGames().then(function(result){
            res.render('admin', {games: result});
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
    Instructor.addGames(game).then(function(){
        res.send(game);
    }).catch(function(err){
        console.log(err);
        res.send(err);
    });
    
});

postRouter.post('/admin/delete_games', function(req, res){
    var game = Instructor.parseInput(req.body);
});

exports.get = getRouter;
exports.post = postRouter;