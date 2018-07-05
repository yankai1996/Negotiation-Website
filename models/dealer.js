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
    })
}