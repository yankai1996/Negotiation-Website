const db = require('./db');

var Game = db.Game;
var Participant = db.Participant;

exports.getOpponent = (id) => {
    return Participant.findOne({
        attributes: ['opponent'],
        where: {
            id: id
        },
        raw: true
    });
}

exports.getWarmupGame = (participantId) => {
    return Game.findOne({
        where: {
            is_warmup: true,
            is_done: false,
            $or: [{buyer_id: participantId},
                {seller_id: participantId}]
        },
        raw: true
    });
}