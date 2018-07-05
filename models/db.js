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

// define table 'participant'
var Participant = sequelize.define('participant', {
    id: {
        type: Sequelize.STRING(4),
        allowNull: false,
        primaryKey: true
    },
    pin: {
        type: Sequelize.STRING(4),
        allowNull: false
    },
    payoff: {
        type: Sequelize.FLOAT(5,2),
        defaultValue: 0
    }, 
    opponent: {
        type: Sequelize.STRING(4),
        unique: true,
        references: {
            model: 'participant',
            key: 'id'
        }
    }
}, {
    timestamps: false,
    freezeTableName: true
});

// define table 'game'
var Game = sequelize.define('game', {
    id: {
        type: Sequelize.STRING(20),
        allowNull: false,
        primaryKey: true
    },
    buyer_id: {
        type: Sequelize.STRING(4),
        references: {
            model: 'participant',
            key: 'id'
        }
    },
    seller_id:{
        type: Sequelize.STRING(4),
        references: {
            model: 'participant',
            key: 'id'
        }
    },
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
        type: Sequelize.INTEGER(2),
        allowNull: false
    },
    w: {
        type: Sequelize.FLOAT(6,2),
        allowNull: false
    },
    exists_2nd_buyer: Sequelize.BOOLEAN,
    is_warmup: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    timestamps: false,
    freezeTableName: true
});


// define table 'games'
var Period = sequelize.define('period', {
    game_id: {
        type: Sequelize.STRING(20),
        references: {
            model: 'game',
            key: 'id'
        },
        allowNull: false
    },
    number: {
        type: Sequelize.INTEGER(2),
        allowNull: false
    },
    proposer: {
        type: Sequelize.STRING(4),
        references: {
            model: 'participant',
            key: 'id'
        },
        allowNull: false
    },
    price: Sequelize.FLOAT(6,2),
    proposed_at: Sequelize.INTEGER(2),
    accepted: {
        type: Sequelize.BOOLEAN,
        allowNull: false
    },
    decided_at: Sequelize.INTEGER(2),
    show_up_2nd_buyer: {
        type: Sequelize.BOOLEAN,
        allowNull: false
    }
}, {
    timestamps: false,
    freezeTableName: true
});

const init = () => {
    Participant.sync();
    Game.sync();
    Period.sync();
}
// init();

exports.Game = Game;
exports.Participant = Participant;
exports.Period = Period;
