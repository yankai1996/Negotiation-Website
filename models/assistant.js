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
    return Period.create({
        game_id:    gameId,
        number:     period.number,
        proposer_id:   period.proposer_id,
        proposer_role: period.proposer_role,
        price:      period.price,
        proposed_at: period.proposed_at,
        accepted:   period.accepted,
        decided_at: period.decided_at,
        show_up_2nd_buyer: period.show_up_2nd_buyer
    });
}

// update the payoff of participants and set the game done
exports.endGame = async (game, period) => {

    var buyerPayoff, sellerPayoff;

    if (period.accepted) {
        buyerPayoff = 12 - period.price - 0.1 * period.number;
        sellerPayoff = period.price - 0.1 * period.number;
    } else if (period.exists_2nd_buyer) {
        buyerPayoff =  -0.1 * period.number;
        sellerPayoff = 17 - 0.1 * period.number;
    } else {
        buyerPayoff =  -0.1 * period.number;
        sellerPayoff = -0.1 * period.number;
    }

    var buyerTotalPayoff = buyerPayoff + await Participant.findOne({
        where: {id: game.buyer_id},
        raw: true
    }).then((result) => {
        return result.payoff;
    });
    await Participant.update({
        payoff: buyerTotalPayoff
    }, {
        where: {id: game.buyer_id}
    });

    var sellerTotalPayoff = sellerPayoff + await Participant.findOne({
        where: {id: game.seller_id},
        raw: true
    }).then((result) => {
        return result.payoff;
    });
    await Participant.update({
        payoff: sellerTotalPayoff
    }, {
        where: {id: game.seller_id}
    });

    return Game.update({
        buyer_payoff: buyerPayoff,
        seller_payoff: sellerPayoff,
        periods: period.number,
        waiting_cost: 0.1 * period.number,
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