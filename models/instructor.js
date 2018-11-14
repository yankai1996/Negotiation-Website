const excel = require('excel4node');
const db = require('./db');
const basePayment = require('../config').basePayment;
const MasterGame = db.MasterGame;
const Game = db.Game;
const Participant = db.Participant;
const Period = db.Period;
const Status = db.Status;

// get all master games
exports.getMasterGames = () => { 
    return MasterGame.findAll({
        raw: true
    });
}

const generateGameId = (seed) => {
    if (seed == null) {
        return "00" + Date.now();
    } else {
        return Date.now() + "-" + ("0" + seed).slice(-2);
    }
}

const generateParticipantId = () => {
    var letters = "abcdefghijklmnopqrstuvwxyz";
    var digits = "0123456789";
    var possible = digits + letters;

    var base = "";
    for (let i = 0; i < 3; i++) {
        base += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    var pos = Math.floor(Math.random() * 4)
    var id = base.slice(0, pos) +
        digits.charAt(Math.floor(Math.random() * digits.length)) +
        base.slice(pos);

    return id;
}

// add a group of games
exports.addMasterGame = async (params) => {
    var noWarmup = await MasterGame.findOne({
        where: {is_warmup: true}
    }).then((result) => {
        return result == null;
    });
    
    var masterGameId = generateGameId();
    var master = await MasterGame.create({
        id:     masterGameId,
        alpha:  params.alpha,
        beta:   params.beta,
        gamma:  params.gamma,
        t:      params.t,
        w:      params.w,
        is_warmup: noWarmup
    }).then((result) => {
        return result.get({plain: true});
    });
    assignMasterGameToAll(master);
}

const assignMasterGameToAll = async (master) => {
    var pairs = await getPairs();
    for (var i in pairs) {
        Game.create({
            id: generateGameId(i),
            master_game: master.id,
            buyer_id: pairs[i].buyer,
            seller_id: pairs[i].seller,
            exists_2nd_buyer: !master.is_warmup && Math.random() < master.gamma
        });
    }
}

// delete a group of games
exports.deleteMasterGame = async (id) => {
    var gameIds = await Game.findAll({
        attributes: ['id'],
        where: {master_game: id},
        raw: true
    }).then((result) => {
        return result.map(game => game.id)
    });
    await Period.destroy({
        where: {
            game_id: {$in: gameIds}
        }
    });
    await Game.destroy({
        where: {master_game: id}
    });
    await MasterGame.destroy({
        where: {id: id}
    });
    return 1;
}


const assignMasterGamesToPair = async (masterGames, buyer, seller) => {
    for (var i in masterGames) {
        var master = masterGames[i];
        await Game.create({
            id: generateGameId(i),
            master_game: master.id,
            buyer_id: buyer,
            seller_id: seller,
            exists_2nd_buyer: !master.is_warmup && Math.random() < master.gamma
        });
    }
}

exports.addPairs = async (n) => {
    var masterGames = await MasterGame.findAll({
        raw: true
    });
    // testID = ['xxxx', '0000'];
    for (var i = 0; i < 2 * n; ) {
        var randomID = generateParticipantId();
        // randomID = testID[i];
        var opponentID = await Participant.findOne({
            where: {opponent: null}
        }).then((result) => {
            return result ? result.id : null;
        });

        await Participant.create({
            id: randomID,
            role: opponentID ? 'buyer' : 'seller',
            payoff: basePayment,
            opponent: opponentID
        }).then((result) => {
            i++;
            if (opponentID){
                Participant.update({
                    opponent: randomID
                }, {
                    where: {id: opponentID}
                });
                assignMasterGamesToPair(masterGames, randomID, opponentID);
            }
        }).catch((error) => {
            console.log(error);
        })
    }
    return n;
}

// get all participants
exports.getParticipants = () => {
    return Participant.findAll({
        attributes: ['id', 'payoff'],
        raw: true
    });
}

// get all participants by pair
const getPairs = async () => {
    var participants = await Participant.findAll();
    var pairs = [];
    for (let i in participants) {
        let p = participants[i];
        if (p.role == 'buyer') {
            pairs.push({buyer: p.id, seller: p.opponent});
        }
    }
    return pairs;
}
exports.getPairs = getPairs;

// get games by one participant id
exports.getGamesByParticipant = async (id) => {
    var games = await Game.findAll({
        attributes: ['id', 'buyer_id', 'seller_id', 
            'master_game', 'exists_2nd_buyer', 'is_done'], 
        where: {
            $or: [{buyer_id: id},
                {seller_id: id}]
        },
        raw: true
    });
    for (var i = 0; i < games.length; i++) {
        var g = games[i];
        var masterGame = await MasterGame.findOne({
            attributes: ['alpha', 'beta', 'gamma', 't', 
                'w', 'is_warmup'],
            where: {
                id: g.master_game
            },
            raw: true
        });
        for (var attr in masterGame) {
            g[attr] = masterGame[attr];
        }
    }
    return games;
}

// delete the pair and all the related games and periods
exports.deletePair = async (buyer, seller) => {
    await Period.destroy({
        where: {
            $or: [{proposer_id: buyer},
                {proposer_id: seller}]
        }
    });
    await Game.destroy({
        where: {
            buyer_id: buyer,
            seller_id: seller
        }
    });
    await Participant.update({
        opponent: null
    }, {
        where: {
            $or: [{id: buyer},
                {id: seller}]
        }
    });
    await Participant.destroy({
        where: {
            $or: [{id: buyer},
                {id: seller}]
        }
    });
    return true;
}

exports.resetPair = async (buyer, seller) => {
    await Period.destroy({
        where: {
            $or: [{proposer_id: buyer},
                {proposer_id: seller}]
        }
    });
    await Game.update({
        price: null,
        buyer_payoff: null,
        seller_payoff: null,
        periods: null,
        cost: null,
        is_done: false
    }, {
        where: {
            buyer_id: buyer,
            seller_id: seller
        }
    });
    await Participant.update({
        payoff: basePayment
    }, {
        where: {
            $or: [{id: buyer},
                {id: seller}]
        }
    });
    return true;
}


exports.getPrtofitByRole = async (role) => {
    role = role || 'buyer';
    var profits = await Participant.findAll({
        where: {role: role}
    }).then((result) => {
        return result.map(p => p.payoff - basePayment);
    });
    return profits;
}


exports.getExcel = async () => {

    var workbook = new excel.Workbook();

    const createWorksheet = async (name, model, option = {raw: true}) => {
        var sheet = workbook.addWorksheet(name);
        var list = await model.findAll(option);
        if (!list[0]) {
            return;
        }
        var keys = Object.keys(list[0]);
        for (let i = 0; i < keys.length; i++) {
            sheet.cell(1, i + 1).string(keys[i]);
        }
        for (let i = 0; i < list.length; i++) {
            let row = i + 2;
            for (let j = 0; j < keys.length; j++) {
                let item = list[i][keys[j]];
                let type = typeof item;
                switch (type) {
                    case "number": 
                        sheet.cell(row, j + 1).number(item);
                        break;
                    case "boolean":
                        sheet.cell(row, j + 1).bool(item);
                        break;
                    case "string":
                        sheet.cell(row, j + 1).string(item);
                        break;
                    default:
                        sheet.cell(row, j + 1).string("");
                }
            }
        }
    }

    await createWorksheet("Participants", Participant);
    await createWorksheet("Master Games", MasterGame);
    await createWorksheet("Games", Game);
    await createWorksheet("Periods", Period, {
        attributes: {exclude: ['id']},
        raw: true
    });

    return workbook;
}

exports.clearParticipants = async () => {
    await Period.destroy({
        where: {}
    });
    await Game.destroy({
        where: {}
    });
    await Participant.update({
        opponent: null
    }, {
        where: {}
    });
    await Participant.destroy({
        where: {}
    });
}

exports.clearAll = async () => {
    await Period.destroy({
        where: {}
    });
    await Game.destroy({
        where: {}
    });
    await Participant.update({
        opponent: null
    }, {
        where: {}
    });
    await Participant.destroy({
        where: {}
    });
    await MasterGame.destroy({
        where: {}
    });
}

exports.pause = () => {
    Status.update({
        paused: true
    }, {where: {}});
}

exports.resume = () => {
    Status.update({
        paused: false
    }, {where: {}});
}

exports.isPaused = async () => {
    return Status.findOne({
        where: {paused: true}
    }).then((result) => {
        return result !== null;
    });
}