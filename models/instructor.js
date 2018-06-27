const Sequelize = require('sequelize');
const db = require('./db');

let Game = db.Game,
    Participant = db.Participant;

var testData = [
    {alpha:1,   beta:1,   gamma:1,   t:1,  w:1,  n:3},
    {alpha:0.5, beta:0.5, gamma:0.5, t:10, w:15, n:4},
    {alpha:0.8, beta:0.5, gamma:0.5, t:10, w:17, n:2},
    {alpha:0.5, beta:0.3, gamma:0.5, t:10, w:17, n:5}
]

// create n games in DB
function createGames(games) {
    var seed = 0;
    for (var i = 0; i < games.length; i++) {
        var game = games[i];
        for (var j = 0; j < game.n; j++) {
            Game.create({
                id:     ("0" + (seed++)).slice(-2) + Date.now(),
                alpha:  game.alpha,
                beta:   game.beta,
                gamma:  game.gamma,
                t:      game.t,
                w:      game.w
            });
        }
    }
}
// createGames(testData);


// get games by groups with the count of duplications
// return type: Promise
exports.getGames = function(){ 
    return Game.findAll({
        attributes: ['alpha', 'beta', 'gamma', 't', 'w', 
            [Sequelize.fn('COUNT', Sequelize.col('id')), 'n']
        ],
        group: ['alpha', 'beta', 'gamma', 't', 'w'],
        raw: true
    });
}

// add a group of games
exports.addGames = async function(game){
    try {
        for (var i = 0; i < game.n; i++) {
            await Game.create({
                id:     ("0" + i).slice(-2) + Date.now(),
                alpha:  game.alpha,
                beta:   game.beta,
                gamma:  game.gamma,
                t:      game.t,
                w:      game.w
            });
        }
        return game;
    } catch (error) {
        console.log(error);
        return error;
    }
}

// delete a group of games
exports.deleteGames = function(game){
    return Game.destroy({
        where: {
            alpha: game.alpha,
            beta:  game.beta,
            gamma: game.gamma,
            t:     game.t,
            w:     game.w
        }
    });
}

// check if exist games with the same parameters
exports.existGames = function(game){
    return Game.findOne({
        where: {
            alpha: game.alpha,
            beta:  game.beta,
            gamma: game.gamma,
            t:     game.t,
            w:     game.w
        }
    }).then(function(result){
        return result !== null;
    });
}

// parse data from string to number
exports.parseInput = function(raw){
    var alpha = parseFloat(raw.alpha),
        beta  = parseFloat(raw.beta),
        gamma = parseFloat(raw.gamma),
        t     = parseInt  (raw.t),
        w     = parseFloat(raw.w),
        n     = parseInt  (raw.n);
    return {
        alpha: alpha,
        beta:  beta,
        gamma: gamma,
        t:     t,
        w:     w,
        n:     n 
    }
}

exports.testData = testData


// count the number of participants
exports.countParticipants = function(){ 
    return Participant.count();
}

exports.addParticipants = async function(n){
    try {
        for (var i = 0; i < n; ){
            var randomID = ("000" + (Math.random() * 1000)).slice(-4);
            var randomPIN = Math.random().toString(18).substring(2, 6);
            await Participant.create({
                id: randomID,
                pin: randomPIN
            }).then(function(result){
                i++;
            }).catch(function(error){
                console.log(error);
            })
        }
        return n;
    } catch (error) {
        console.log(error)
        return error;
    }
}