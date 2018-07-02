const Sequelize = require('sequelize');
const db = require('./db');

let Game = db.Game,
    Participant = db.Participant;

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
            var opponent = await Participant.findOne({
                where: {opponent: null}
            });
            var opponentID = opponent ? opponent.id : null;

            await Participant.create({
                id: randomID,
                pin: randomPIN,
                payoff: 0,
                opponent: opponentID
            }).then(function(result){
                i++;
                // console.log(JSON.stringify(result));
                if (opponent){
                    Participant.update({
                        opponent: randomID
                    }, {
                        where: {id: opponentID}
                    });
                }
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

// get all participants
exports.getParticipants = function(){
    return Participant.findAll({
        attributes: ['id', 'payoff'],
        raw: true
    });
}

// get all participants by pair
exports.getPairedParticipants = async function(){
    var participants = await Participant.findAll();
    var pairs = {},
        result = [],
        single;
    for (var i in participants) {
        if (!(participants[i].opponent in pairs)){
            var first = participants[i].id,
                second = participants[i].opponent;
            if (!second) {
                single = first;
                continue;
            }
            pairs[first] = second;
            result.push({first:first, second:second});
        }
    }
    if (single) {
        result.push({first:single, second:null});
    }
    return result;
}

// get games by one participant id
exports.getGamesByParticipant = function(id){
    console.log(id);
    return Game.findAll({
        attributes: ['buyer_id', 'seller_id', 'alpha', 'beta', 'gamma', 't', 'w'], 
        where: {
            $or: [{buyer_id: id},
                {seller_id: id}]
        }
    })
}