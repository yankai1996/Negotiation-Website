const Sequelize = require('sequelize');
const config = require('../config').dbConfig;

var sequelize = new Sequelize(
    config.database, 
    config.username, 
    config.password, 
    {
        host: config.host,
        port: config.port,
        dialect: 'mysql',
        pool: {
            max: 5,
            min: 0,
            idle: 30000
        }
    }
);

var Status = sequelize.define('status', {
    paused: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    timestamps: false,
    freezeTableName: true
});

// define table 'participant'
var Participant = sequelize.define('participant', {
    id: {
        type: Sequelize.STRING(4),
        allowNull: false,
        primaryKey: true
    },
    payoff: {
        type: Sequelize.FLOAT(5,2),
        defaultValue: 40
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

var MasterGame = sequelize.define('master_game', {
    id: {
        type: Sequelize.STRING(20),
        allowNull: false,
        primaryKey: true
    },
    alpha: {
        type: Sequelize.FLOAT(3,2),
        allowNull: false
    },
    beta: {
        type: Sequelize.FLOAT(3,2),
        allowNull: false,
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
    is_warmup: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
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
    master_game: {
        type: Sequelize.STRING(20),
        allowNull: false,
        references: {
            model: 'master_game',
            key: 'id'
        }
    },
    buyer_id: {
        type: Sequelize.STRING(4),
        references: {
            model: 'participant',
            key: 'id'
        },
        allowNull: false
    },
    seller_id: {
        type: Sequelize.STRING(4),
        references: {
            model: 'participant',
            key: 'id'
        },
        allowNull: false
    },
    exists_2nd_buyer: {
        type: Sequelize.BOOLEAN,
        allowNull: false
    },
    price: Sequelize.FLOAT(6,2),
    buyer_payoff: Sequelize.FLOAT(6,2),
    seller_payoff: Sequelize.FLOAT(6,2),
    periods: Sequelize.INTEGER(2),
    cost: Sequelize.FLOAT(4,2),
    is_done: {
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
    proposer_id: {
        type: Sequelize.STRING(4),
        references: {
            model: 'participant',
            key: 'id'
        },
        allowNull:false
    },
    proposer_role: { // "buyer" or "seller"
        type: Sequelize.STRING(6),
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

const init = async () => {
    MasterGame.sync();
    Participant.sync();
    Game.sync();
    Period.sync();
    await Status.sync();
    if (! await Status.findOne()) {
        Status.create();
    }
}
// init();

exports.MasterGame = MasterGame;
exports.Game = Game;
exports.Participant = Participant;
exports.Period = Period;
exports.Status = Status;