const Sequelize = require('sequelize');
const db = require('./db');

let Game = db.Game,
    Participant = db.Participant;

// parse game data to numbers
exports.parseGame = function(raw){
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

exports.verifyInstructor = function(username, password){
    return (username == 'hello' 
        &&  password == 'world');
}

exports.verifyParticipant = function(username, password){
    return Participant.findOne({
        where: {
            id: username,
            pin: password
        }
    }).then(function(result){
        return result !== null;
    });
}