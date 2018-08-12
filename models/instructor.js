const excel = require('excel4node');
const db = require('./db');
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
    await MasterGame.create({
        id:     masterGameId,
        alpha:  params.alpha,
        beta:   params.beta,
        gamma:  params.gamma,
        t:      params.t,
        w:      params.w,
        is_warmup: noWarmup
    });
    assignMasterGameToAll(masterGameId, params.gamma);
}

const assignMasterGameToAll = async (masterGameId, gamma) => {
    var pairs = await getPairs();
    for (var i in pairs) {
        var first = pairs[i].first;
        var second = pairs[i].second;
        var fisrtIsBuyer = await Game.findOne({
            where: {buyer_id: first}
        }).then((result) => {
            result !== null;
        })
        var buyer = fisrtIsBuyer ? first : second;
        var seller = fisrtIsBuyer ? second : first;
        Game.create({
            id: generateGameId(i),
            master_game: masterGameId,
            buyer_id: buyer,
            seller_id: seller,
            exists_2nd_buyer: Math.random() < gamma
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
            exists_2nd_buyer: Math.random() < master.gamma
        });
    }
}

exports.addPairs = async (n) => {
    var masterGames = await MasterGame.findAll({
        raw: true
    });
    for (var i = 0; i < 2 * n; ) {
        var randomID = generateParticipantId();
        var opponentID = await Participant.findOne({
            where: {opponent: null}
        }).then((result) => {
            return result ? result.id : null;
        });

        await Participant.create({
            id: randomID,
            payoff: 40,
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
    var temp = {};
    var pairs = [];
    for (var i in participants) {
        var p = participants[i];
        if (!(p.opponent in temp)){
            var first = p.id;
            var second = p.opponent;
            temp[first] = second;
            pairs.push({first:first, second:second});
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
exports.deletePair = async (first, second) => {
    await Period.destroy({
        where: {
            $or: [{proposer_id: first},
                {proposer_id: second}]
        }
    });
    await Game.destroy({
        where: {
            $or: [{buyer_id: first},
                {seller_id: first}]
        }
    });
    await Participant.update({
        opponent: null
    }, {
        where: {
            $or: [{id: first},
                {id: second}]
        }
    });
    await Participant.destroy({
        where: {
            $or: [{id: first},
                {id: second}]
        }
    });
    return true;
}

exports.resetPair = async (first, second) => {
    await Period.destroy({
        where: {
            $or: [{proposer_id: first},
                {proposer_id: second}]
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
            $or: [{buyer_id: first},
                {seller_id: first}]
        }
    });
    await Participant.update({
        payoff: 40
    }, {
        where: {
            $or: [{id: first},
                {id: second}]
        }
    });
    return true;
}


exports.getExcel = async () => {
    var workbook = new excel.Workbook();

    const list2sheet = (list, sheet) => {
        var keys = Object.keys(list[0]);
        for (let i = 0; i < keys.length; i++) {
            sheet.cell(1, i + 1).string(keys[i]);
        }
        for (let i = 0; i < list.length; i++) {
            let row = i + 2;
            for (let j = 0; j < keys.length; j++) {
                let item = list[i][keys[j]];
                var type = typeof item;
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

    var participantSheet = workbook.addWorksheet("Participants");
    var participantList = await Participant.findAll({raw: true});
    list2sheet(participantList, participantSheet);

    var masterGameSheet = workbook.addWorksheet("Master Games")
    var masterGameList = await MasterGame.findAll({raw: true});
    list2sheet(masterGameList, masterGameSheet);

    var gameSheet = workbook.addWorksheet("Games")
    var gameList = await Game.findAll({raw: true});
    list2sheet(gameList, gameSheet);

    var periodSheet = workbook.addWorksheet("Periods")
    var periodList = await Period.findAll({
        attributes: {exclude: ['id']},
        raw: true
    });
    list2sheet(periodList, periodSheet);

    return workbook;
}

exports.clearParticipants = async () => {
    await Period.destroy();
    await Game.destroy();
    await Participant.update({
        opponent: null
    });
    await Participant.destroy();
}

exports.clearAll = async () => {
    await Period.destroy();
    await Game.destroy();
    await Participant.update({
        opponent: null
    });
    await Participant.destroy();
    await MasterGame.destroy();
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