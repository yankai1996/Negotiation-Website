const Sequelize = require('sequelize');
const config = require('./config');

var sequelize = new Sequelize(
    config.database, 
    config.username, 
    config.password, 
    {
        host: config.host,
        dialect: 'mysql',
        pool: {
            max: 5,
            min: 0,
            idle: 30000
        }
    }
);

// define table 'games'
var Game = sequelize.define('game', {
    id: {
        type: Sequelize.STRING(20),
        allowNull: false,
        primaryKey: true
    },
    buyer_id: Sequelize.STRING(4),
    seller_id: Sequelize.STRING(4),
    alpha: {
        type: Sequelize.FLOAT(3,2),
        allowNull: false
    },
    beta: {
        type: Sequelize.FLOAT(3,2),
        allowNull: false
    },
    gamma: {
        type: Sequelize.FLOAT(3,2),
        allowNull: false
    },
    t: {
        type: Sequelize.INTEGER(4),
        allowNull: false
    },
    w: {
        type: Sequelize.FLOAT(6,2),
        allowNull: false
    },
    exists_2nd_buyer: Sequelize.BOOLEAN
}, {
    timestamps: false
});

// define table 'participants'
var Participant = sequelize.define('participant', {
    id: {
        type: Sequelize.STRING(4),
        allowNull: false,
        primaryKey: true
    },
    pin: {
        type: Sequelize.STRING(4),
        allowNull: false
    }
}, {
    timestamps: false
});

exports.Game = Game;
exports.Participant = Participant;

exports.init = function(){
    Game.sync();
    Participant.sync();
}