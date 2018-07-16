const db = require('./db');
const MasterGame = db.MasterGame;
const Game = db.Game;
const Participant = db.Participant;
const Period = db.Period;


exports.getOpponent = (id) => {
    return Participant.findOne({
        attributes: ['opponent'],
        where: {
            id: id
        },
        raw: true
    });
}

exports.existFinishedGames = (participantId) => {
    return Game.findOne({
        where: {
            is_done: true,
            $or: [{buyer_id: participantId},
                {seller_id: participantId}]
        },
        raw: true
    }).then((result) => {
        return result !== null;
    });
}

exports.existUnfinishedGames = (participantId) => {
    return Game.findOne({
        where: {
            is_done: false,
            $or: [{buyer_id: participantId},
                {seller_id: participantId}]
        },
        raw: true
    }).then((result) => {
        return result !== null;
    });
}

// get a game that has not been done
exports.getNewGame = async (participantId) => {
    // get the warmup game first
    var warmup = await MasterGame.findOne({
        attributes:['id', 'alpha', 'beta', 'gamma', 't', 'w', 'is_warmup'],
        where: {is_warmup: true},
        raw: true
    });
    var game = await Game.findOne({
        where: {
            master_game: warmup.id,
            is_done: false,
            $or: [{buyer_id: participantId},
                {seller_id: participantId}]
        },
        raw: true
    });

    var masterGame;
    if (game) {
        masterGame = warmup;
    } else {
        // if warmup game has been done, find a game 
        game = await Game.findOne({
            where: {
                is_done: false,
                $or: [{buyer_id: participantId},
                    {seller_id: participantId}]
            },
            raw: true
        });
        if (!game) {
            return null;
        }
        masterGame = await MasterGame.findOne({
            attributes:['alpha', 'beta', 'gamma', 't', 'w', 'is_warmup'],
            where: {
                id: game.master_game
            },
            raw: true
        });
    }

    // associate parametes to the game
    for (let i in masterGame) {
        if (i != 'id') {
            game[i] = masterGame[i];
        }
    }
    return game;
}

exports.savePeriod = (gameId, period) => {
    return Period.create({
        game_id: gameId,
        number: period.number,
        proposer: period.proposer,
        price: period.price,
        proposed_at: period.proposed_at,
        accepted: period.accepted,
        decided_at: period.decided_at,
        show_up_2nd_buyer: period.show_up_2nd_buyer
    });
}

exports.endGame = (gameId) => {
    return Game.update({
        is_done: true
    }, {
        where: {id: gameId}
    })
}