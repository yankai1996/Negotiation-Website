const db = require('./db');
const MasterGame = db.MasterGame;
const Game = db.Game;
const Participant = db.Participant;
const Period = db.Period;
const Status = db.Status;


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

exports.countUnfinishedGames = (participantId) => {
    return Game.count({
        where: {
            is_done: false,
            $or: [{buyer_id: participantId},
                {seller_id: participantId}]
        }
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
<<<<<<< HEAD
            attributes:['alpha', 'beta', 't', 'is_warmup'],
=======
            attributes:['alpha', 'beta', 'gamma', 't', 'w', 'is_warmup'],
>>>>>>> 9e777c9713dfe60a1f046b9a34ffdee7c3bd6b4e
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
    // console.log(game);
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
<<<<<<< HEAD
        show_up_external_buyer: period.show_up_external_buyer,
        external_buyers: period.external_buyers,
        highest_price: period.highest_price
=======
        show_up_2nd_buyer: period.show_up_2nd_buyer
>>>>>>> 9e777c9713dfe60a1f046b9a34ffdee7c3bd6b4e
    });
}

// update the payoff of participants and set the game done
exports.endGame = async (game, period) => {

    var buyerPayoff, sellerPayoff;
    var cost = +(0.1 * period.number).toFixed(2);

    if (period.accepted) {
        buyerPayoff = 12 - period.price - cost;
        sellerPayoff = period.price - cost;
<<<<<<< HEAD
    } else {
        buyerPayoff =  -cost;
        sellerPayoff = period.highest_price - cost;
=======
    } else if (game.exists_2nd_buyer) {
        buyerPayoff =  -cost;
        sellerPayoff = 17 - cost;
    } else {
        buyerPayoff =  -cost;
        sellerPayoff = -cost;
>>>>>>> 9e777c9713dfe60a1f046b9a34ffdee7c3bd6b4e
    }

    if (!game.is_warmup) {
        await Participant.increment('payoff', {
            by: buyerPayoff,
            where: {id: game.buyer_id}
        });
        await Participant.increment('payoff', {
            by: sellerPayoff,
            where: {id: game.seller_id}
        });
    }
    
    return Game.update({
        price: period.price,
<<<<<<< HEAD
        external_buyers: period.external_buyers,
        highest_price: period.highest_price,
=======
>>>>>>> 9e777c9713dfe60a1f046b9a34ffdee7c3bd6b4e
        buyer_payoff: buyerPayoff,
        seller_payoff: sellerPayoff,
        periods: period.number,
        cost: cost,
        is_done: true
    }, {
        where: {id: game.id}
    }).then((result) => {
        return {
            price: period.price,
<<<<<<< HEAD
            externalBuyers: period.external_buyers,
            highestPrice: period.highest_price,
            cost: cost,
=======
            cost: cost,
            exists2ndBuyer: game.exists_2nd_buyer,
>>>>>>> 9e777c9713dfe60a1f046b9a34ffdee7c3bd6b4e
            buyerProfit: buyerPayoff,
            sellerProfit: sellerPayoff
        }
    })
}


exports.deletePeriods = (gameId) => {
    return Period.destroy({
        where: {game_id: gameId}
    });
}


exports.getSummary = async (id) => {
    var warmupId = await MasterGame.findOne({
        where: {is_warmup: true}
    }).then((result) => {
        return result.id;
    });
    var summary = await Game.findAll({
        where: {
            $not: [{master_game: warmupId}],
            $or: [{buyer_id: id},
                {seller_id: id}]
        }
    }).then((result) => {
        return result.map((g) => {
            return {
                price: g.price,
                cost: g.cost,
<<<<<<< HEAD
                externalBuyers: g.external_buyers,
                highestPrice: g.highest_price,
=======
                exists2ndBuyer: g.exists_2nd_buyer,
>>>>>>> 9e777c9713dfe60a1f046b9a34ffdee7c3bd6b4e
                selfProfit: g.buyer_id == id
                    ? g.buyer_payoff
                    : g.seller_payoff,
                opponentProfit: g.buyer_id == id
                    ? g.seller_payoff
                    : g.buyer_payoff,
            }
        });
    });
    return summary;
}

exports.isPaused = async () => {
    return Status.findOne({
        where: {paused: true}
    }).then((result) => {
        return result !== null;
    });
}