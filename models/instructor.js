const Sequelize = require('sequelize');
const db = require('./db');
var System = require('./system');

let Game = db.Game,
    Participant = db.Participant;

// get games by groups with the count of duplications
// return type: Promise
exports.getGames = () => { 
    return Game.findAll({
        attributes: ['alpha', 'beta', 'gamma', 't', 'w', 
            [Sequelize.fn('COUNT', Sequelize.col('id')), 'n']
        ],
        where: {
            is_warmup: false
        },
        group: ['alpha', 'beta', 'gamma', 't', 'w'],
        raw: true
    });
}

// add a group of games
exports.addGames = async (game) => {
    try {
        for (var i = 0; i < game.n; i++) {
            await Game.create({
                id:     System.generateGameId(i),
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
exports.deleteGames = (game) => {
    return Game.destroy({
        where: {
            alpha: game.alpha,
            beta:  game.beta,
            gamma: game.gamma,
            t:     game.t,
            w:     game.w,
            is_warmup: false
        }
    });
}

// check if exist games with the same parameters
exports.existGames = (game) => {
    return Game.findOne({
        where: {
            alpha: game.alpha,
            beta:  game.beta,
            gamma: game.gamma,
            t:     game.t,
            w:     game.w,
            is_warmup: false
        }
    }).then((result) => {
        return result !== null;
    });
}

// count the number of participants
exports.countParticipants = () => { 
    return Participant.count();
}

// add n participants
exports.addParticipants = async (n) => {
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
            }).then((result) => {
                i++;
                // console.log(JSON.stringify(result));
                if (opponent){
                    Participant.update({
                        opponent: randomID
                    }, {
                        where: {id: opponentID}
                    });
                    System.addWarmupGames(randomID, opponentID);
                }
            }).catch((error) => {
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
exports.getParticipants = () => {
    return Participant.findAll({
        attributes: ['id', 'payoff'],
        raw: true
    });
}

// get all participants by pair
exports.getPairedParticipants = async () => {
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
exports.getGamesByParticipant = (id) => {
    return Game.findAll({
        attributes: ['id', 'buyer_id', 'seller_id', 
            'alpha', 'beta', 'gamma', 't', 'w'], 
        where: {
            is_warmup: false,
            $or: [{buyer_id: id},
                {seller_id: id}]
        }
    })
}

// remove the buyer and seller from a game
exports.removePairFromGame = (id) => {
    return Game.update({
        buyer_id: null,
        seller_id: null
    }, {
        where: {id: id}
    });
}

// get all games that have not been assigned to pairs
exports.getAvailableGames = () => {
    return Game.findAll({
        attributes: ['alpha', 'beta', 'gamma', 't', 'w', 
            [Sequelize.fn('COUNT', Sequelize.col('id')), 'available']
        ],
        where: {
            $and: [{buyer_id: null},
                {seller_id: null}]
        },
        group: ['alpha', 'beta', 'gamma', 't', 'w'],
        raw: true
    })
}

exports.assignGamesToPair = async (games) => {
    for (var i = 0; i < games.length; i++) {
        var g = games[i];
        await Game.update({
            buyer_id: g.buyer_id,
            seller_id: g.seller_id
        }, {
            where: {
                buyer_id: null,
                seller_id: null,
                alpha: g.alpha,
				beta: g.beta,
				gamma: g.gamma,
				t: g.t,
                w: g.w
            },
            limit: 1
        });
    }
    return games;
}