const Sequelize = require('sequelize');
const config = require('./config');

var sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    dialect: 'mysql',
    pool: {
        max: 5,
        min: 0,
        idle: 30000
    }
});

var Game = sequelize.define('game', {
    id: {
        type: Sequelize.STRING(20),
        allowNull: false,
        primaryKey: true
    },
    buyer_id: Sequelize.STRING(4),
    seller_id: Sequelize.STRING(4),
    alpha: {
        type: Sequelize.FLOAT,
        allowNull: false
    },
    beta: {
        type: Sequelize.FLOAT,
        allowNull: false
    },
    gamma: {
        type: Sequelize.FLOAT,
        allowNull: false
    },
    t: {
        type: Sequelize.INTEGER(4),
        allowNull: false
    },
    w: {
        type: Sequelize.FLOAT,
        allowNull: false
    },
    exists_2nd_buyer: Sequelize.BOOLEAN
}, {
    timestamps: false
});

var testData = [
    {alpha:1,   beta:1,   gamma:1,   t:1,  w:1,  n:3},
    {alpha:0.5, beta:0.5, gamma:0.5, t:10, w:15, n:4},
    {alpha:0.8, beta:0.5, gamma:0.5, t:10, w:17, n:2},
    {alpha:0.5, beta:0.3, gamma:0.5, t:10, w:17, n:5}
]

// create n games in DB
function createGames(games) {
    Game.sync();
    var seed = 0;
    for (var i = 0; i < games.length; i++) {
        var game = games[i];
        for (var j = 0; j < game.n; j++) {
            Game.create({
                id:     Date.now() + ("0" + (seed++)).slice(-2),
                alpha:  game.alpha,
                beta:   game.beta,
                gamma:  game.gamma,
                t:      game.t,
                w:      game.w
            });
        }
    }
}
// createGames(testData);

// get games by groups with the count of duplications
// return type: Promise
exports.getGames = function(){ 
    return Game.findAll({
        attributes: ['alpha', 'beta', 'gamma', 't', 'w', 
            [sequelize.fn('COUNT', sequelize.col('id')), 'n']
        ],
        group: ['alpha', 'beta', 'gamma', 't', 'w'],
        raw: true
    });
}

// add a group of games
exports.addGames = function(game){
    for (var i = 0; i < game.n; i++) {
        Game.create({
            id:     Date.now() + ("0" + i).slice(-2),
            alpha:  game.alpha,
            beta:   game.beta,
            gamma:  game.gamma,
            t:      game.t,
            w:      game.w
        });
    }
}

exports.testData = testData