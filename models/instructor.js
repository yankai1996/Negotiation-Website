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
        type: Sequelize.STRING(10),
        primaryKey: true
    },
    buyer_id: Sequelize.STRING(4),
    seller_id: Sequlize.STRING(4),
    alpha: Sequelize.FLOAT,
    beta: Sequelize.FLOAT,
    gamma: Sequelize.FLOAT,
    t: Sequelize.FLOAT,
    w: Sequelize.FLOAT,
    exists_2nd_buyer: Sequence.BOOLEAN
}, {
    timestamps: false
})
