const Sequelize = require('sequelize');
const db = require('./db');

let Game = db.Game,
    Participant = db.Participant;

// parse game data to numbers
exports.parseGame = function(raw){
    var alpha = parseFloat(raw.alpha),
        beta  = parseFloat(raw.beta),
        gamma = parseFloat(raw.gamma),
        t     = parseInt  (raw.t),
        w     = parseFloat(raw.w),
        n     = parseInt  (raw.n);
    return {
        alpha: alpha,
        beta:  beta,
        gamma: gamma,
        t:     t,
        w:     w,
        n:     n 
    }
}