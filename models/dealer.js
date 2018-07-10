const db = require('./db');
const MasterGame = db.MasterGame;
const Game = db.Game;
const Participant = db.Participant;
const EVENT = require('../controllers/socket').EVENT;


function Dealer(first, second, io) {
    this.first = first;
    this.second = second;
    this.io = io;

    var buyer, seller;

    this.warmup = async () => {
        var masterGame = await MasterGame.findOne({
            where: {is_warmup: true},
            raw: true
        });
        var game = await Game.findOne({
            where: {
                master_game: masterGame.id,
                is_done: false,
                $or: [{buyer_id: this.first},
                    {seller_id: this.first}]
            },
            raw: true
        });
        buyer = game.buyer_id;
        seller = game.seller_id;
    }

    this.period = () => {

    }

    this.timeout = () => {

    }

    this.newGame = () => {

    }
}
exports.Dealer = Dealer;


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