const Sequelize = require('sequelize');
const config = require('./config');

const sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    dialect: 'mysql',
    pool: {
        max: 100,
        min: 0,
        idle: 30000
    }
});

var Participant = sequelize.define('participant', {
    id: {
        type: Sequelize.STRING(4),
        primaryKey: true
    }
}, {
    timestamps: false
})

// Participant.sync();

exports.check = function(username, password) {
    console.log('Checked!')
}