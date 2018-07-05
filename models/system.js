const Sequelize = require('sequelize');
const db = require('./db');

let Game = db.Game,
    Participant = db.Participant;

const generateGameId = (seed) => {
    return ("0" + seed).slice(-2) + Date.now();
}

exports.generateGameId = generateGameId;

// parse game data to numbers
exports.parseGame = (raw) => {
    for (var key in raw) {
        var temp;
        if (key == 't' || key == 'n'){
            temp = parseInt(raw[key]);
        } else {
            temp = parseFloat(raw[key]);
            if (temp) {
                temp = parseFloat(temp.toFixed(2))
            }
        }
        raw[key] = temp;
    }

    return {
        alpha: raw.alpha,
        beta:  raw.beta,
        gamma: raw.gamma,
        t:     raw.t,
        w:     raw.w,
        n:     raw.n 
    }
}

exports.verifyInstructor = (username, password) => {
    return (username == 'admin' 
        &&  password == 'admin');
}

exports.verifyParticipant = (username, password) => {
    return Participant.findOne({
        where: {
            id: username,
            pin: password
        }
    }).then((result) => {
        return result !== null;
    });
}

exports.addWarmupGames = async (first, second) => {
    var param = {
        alpha: 0.5,
        beta:  0.5,
        gamma: 0.5,
        t:     10,
        w:     15
    };
    var keys = ['alpha', 'beta', 'gamma', 't', 'w'];
    var randKey = keys[Math.floor(Math.random() * keys.length)];
    var randScale = (0.5 + Math.random()).toFixed(1);
    param[randKey] *= randScale;
    var pair = [first, second];

    for (var i = 0; i < 2; i++) {
        await Game.create({
            id: generateGameId(i),
            buyer_id: pair[i],
            seller_id: pair[1 - i],
            alpha:  param.alpha,
            beta:   param.beta,
            gamma:  param.gamma,
            t:      param.t,
            w:      param.w,
            is_warmup: true
        }).catch((error) => {
            console.log(error);
        });
    }
}

exports.getOpponent = (id) => {
    return Participant.findOne({
        attributes: ['opponent'],
        where: {
            id: id
        },
        raw: true
    })
}