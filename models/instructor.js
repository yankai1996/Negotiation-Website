const Sequelize = require('sequelize');
const db = require('./db');

let Game = db.Game,
    Participant = db.Participant;

// db.init();

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

// count the number of participants
exports.countParticipants = function(){ 
    return Participant.count();
}

// add n participants
exports.addParticipants = async function(n){
    try {
        for (var i = 0; i < n; ){
            var randomID = ("000" + (Math.random() * 1000)).slice(-4);
            var randomPIN = Math.random().toString(18).substring(2, 6);
            await Participant.create({
                id: randomID,
                pin: randomPIN,
                payoff: 0
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

exports.getParticipants = function(){
    return Participant.findAll({
        attributes: ['id', 'payoff'],
        raw: true
    });
}
