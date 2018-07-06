const Sequelize = require('sequelize');
const db = require('./db');

var MasterGame = db.MasterGame;
var Game = db.Game;
var Participant = db.Participant;

// get games by groups with the count of duplications
// return type: Promise
exports.getGames = () => { 
    return MasterGame.findAll({
        raw: true
    });
}

const generateGameId = (seed) => {
    return ("0" + seed).slice(-2) + Date.now();
}

// add a group of games
exports.addGames = async (params) => {
    var noMasterGame = await MasterGame.findOne().then((result) => {
        return result == null;
    });
    var masterGameId = generateGameId(0);
    await MasterGame.create({
        id:     masterGameId,
        alpha:  params.alpha,
        beta:   params.beta,
        gamma:  params.gamma,
        t:      params.t,
        w:      params.w,
        is_warmup: noMasterGame
    });
    assignMasterGameToAll(masterGameId, params);
    return params;
}

const assignMasterGameToAll = async (masterGameId, params) => {
    var pairs = await getPairs();
    for (var i in pairs) {
        var first = pairs[i].first;
        var second = pairs[i].second;
        var fisrtIsBuyer = await Game.findOne({
            where: {buyer_id: first}
        }).then((result) => {
            result !== null;
        })
        var buyer = fisrtIsBuyer ? first: second;
        var seller = fisrtIsBuyer ? second : first;
        Game.create({
            id: generateGameId(i),
            master_game: masterGameId,
            buyer_id: buyer,
            seller_id: seller,
            exists_2nd_buyer: Math.random() < params.gamma
        });
    }
}

// delete a group of games
exports.deleteMasterGame = async (id) => {
    await Game.destroy({
        where: {master_game: id}
    });
    MasterGame.destroy({
        where: {id: id}
    });
    return 1;
}

// count the number of participants
exports.countParticipants = () => { 
    return Participant.count();
}

const assignMasterGamesToPair = async (masterGames, buyer, seller) => {
    for (var i in masterGames) {
        var master = masterGames[i];
        await Game.create({
            id: generateGameId(i),
            master_game: master.id,
            buyer_id: buyer,
            seller_id: seller,
            exists_2nd_buyer: Math.random() < master.gamma
        });
    }
}

exports.addPairs = async (n) => {
    var masterGames = await MasterGame.findAll({
        raw: true
    });
    console.log("!!!!!!" + n)
    for (var i = 0; i < 2 * n; ) {
        var randomID = Math.random().toString(36).substring(2, 6);
        var opponent = await Participant.findOne({
            where: {opponent: null}
        });
        var opponentID = opponent ? opponent.id : null;

        await Participant.create({
            id: randomID,
            payoff: 0,
            opponent: opponentID
        }).then((result) => {
            i++;
            if (opponent){
                Participant.update({
                    opponent: randomID
                }, {
                    where: {id: opponentID}
                });
                assignMasterGamesToPair(masterGames, randomID, opponentID);
            }
        }).catch((error) => {
            console.log(error);
        })
    }
    return n;
}

// get all participants
exports.getParticipants = () => {
    return Participant.findAll({
        attributes: ['id', 'payoff'],
        raw: true
    });
}

// get all participants by pair
const getPairs = async () => {
    var participants = await Participant.findAll();
    var temp = {};
    var pairs = [];
    for (var i in participants) {
        var p = participants[i];
        if (!(p.opponent in temp)){
            var first = p.id;
            var second = p.opponent;
            temp[first] = second;
            pairs.push({first:first, second:second});
        }
    }
    return pairs;
}
exports.getPairs = getPairs;

// get games by one participant id
exports.getGamesByParticipant = async (id) => {
    var games = await Game.findAll({
        attributes: ['id', 'buyer_id', 'seller_id', 
            'master_game', 'exists_2nd_buyer', 'is_done'], 
        where: {
            $or: [{buyer_id: id},
                {seller_id: id}]
        },
        raw: true
    });
    for (var i = 0; i < games.length; i++) {
        var g = games[i];
        var masterGame = await MasterGame.findOne({
            attributes: ['alpha', 'beta', 'gamma', 't', 
                'w', 'is_warmup'],
            where: {
                id: g.master_game
            },
            raw: true
        });
        for (var attr in masterGame) {
            g[attr] = masterGame[attr];
        }
    }
    return games;
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

// delete games that have not been assigned to pairs
exports.deleteExtraGames = (game) => {
    return Game.destroy({
        where: {
            buyer_id: null,
            seller_id: null,
            alpha: game.alpha,
            beta:  game.beta,
            gamma: game.gamma,
            t:     game.t,
            w:     game.w
        }
    });
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