const db = require('./db');
const MasterGame = db.MasterGame;
const Game = db.Game;
const Participant = db.Participant;
const Period = db.Period;

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
exports.addMasterGame = async (params) => {
    var noMasterGame = await MasterGame.findOne().then((result) => {
        return result == null;
    });
    console.log(params)
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
    var games = await Game.findAll({
        attributes: ['id'],
        where: {master_game: id},
        raw: true
    });
    await Period.destroy({
        where: {
            game_id: {$in: games.map(g => g.id)}
        }
    });
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

// delete the pair and all the related games and periods
exports.deletePair = async (first, second) => {
    await Period.destroy({
        where: {
            $or: [{proposer: first},
                {proposer: second}]
        }
    });
    await Game.destroy({
        where: {
            $or: [{buyer_id: first},
                {seller_id: first}]
        }
    });
    await Participant.update({
        opponent: null
    }, {
        where: {
            $or: [{id: first},
                {id: second}]
        }
    });
    await Participant.destroy({
        where: {
            $or: [{id: first},
                {id: second}]
        }
    });
    return 2;
}


