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

exports.savePeriod = async (gameId, period) => {
    // var existsPeriod = await Period.findOne({
    //     where: {
    //         game_id: gameId,
    //         number: period.number
    //     }
    // }).then((result) => {
    //     return result !== null;
    // });
    // if (existsPeriod) {
    //     return;
    // }
    return Period.create({
        game_id:    gameId,
        number:     period.number,
        proposer:   period.proposer,
        price:      period.price,
        proposed_at: period.proposed_at,
        accepted:   period.accepted,
        decided_at: period.decided_at,
        show_up_2nd_buyer: period.show_up_2nd_buyer
    });
}

// update the payoff of participants and set the game done
exports.endGame = async (game, period) => {
    var pair = [game.buyer_id, game.seller_id];
    for (let i = 0; i < 2; i++){
        let id = pair[i];
        let payoff = await Participant.findOne({
            attributes: ['payoff'],
            where: {id: id},
            raw: true
        }).then((result) => {
            return result.payoff;
        });
        await Participant.update({
            payoff: (payoff + 15 - 0.1 * period.number)
        }, {
            where: {id: id}
        });
    }

    return Game.update({
        is_done: true
    }, {
        where: {id: game.id}
    })
}


exports.deletePeriods = (gameId) => {
    return Period.destroy({
        where: {game_id: gameId}
    });
}