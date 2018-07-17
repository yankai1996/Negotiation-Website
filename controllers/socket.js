var socketio = require('socket.io');
var Assistant = require('../models/assistant');

const EVENT = {
    COMPLETE: 'complete',
    DECIDE: 'decide',
    END_PERIOD: 'end period',
    LOGIN: 'login',
    LOST_OP: 'lost opponent',
    NEW_PERIOD: 'new period',
    PROPOSE: 'propose',
    READY: 'ready',
    START: 'start',
    SYNC_GAME: 'sync game',
    TEST: 'test',
    WAIT: 'wait opponent',
}


function Dealer(self, opponent, io) {
    this.self = self;
    this.opponent = opponent;
    this.io = io;
    this.game = {};
    this.period = {};
}

Dealer.prototype.toBuyer = function (event, data) {
    this.io.to(this.game.buyer_id).emit(event, data);
}

Dealer.prototype.toSeller = function (event, data) {
    this.io.to(this.game.seller_id).emit(event, data);
}

Dealer.prototype.toBoth = function (event, data) {
    this.toBuyer(event, data);
    this.toSeller(event, data);
}

Dealer.prototype.newGame = async function () {
    var game = await Assistant.getNewGame(this.self);
    if (!game) {
        this.toBoth(EVENT.COMPLETE, "You have finished all the games.");
    } else {
        this.game = game;
        Assistant.deletePeriods(this.game.id);
        this.io.to(this.opponent).emit(EVENT.SYNC_GAME, this.game);
    }
}

Dealer.prototype.syncGame = function (game) {
    this.game = game;
}

Dealer.prototype.syncPeriod = function (period) {
    this.period = period;
}

Dealer.prototype.startGame = function () {
    this.toBuyer(EVENT.START, {
        alpha: this.game.alpha,
        beta: this.game.beta,
        gamma: this.game.gamma,
        t: this.game.t,
        w: this.game.w,
        role: 'buyer'
    });
    this.toSeller(EVENT.START, {
        alpha: this.game.alpha,
        beta: this.game.beta,
        gamma: this.game.gamma,
        t: this.game.t,
        w: this.game.w,
        role: 'seller'
    });
    setTimeout(() => {
        this.nextPeriod(true);
    }, 5000);
}

Dealer.prototype.nextPeriod = function (initial = false) {
    // if it has reached the end of the game
    if (!initial && this.period.number == this.game.t) {
        return false;
    }

    this.period = {
        number: initial 
            ? 1
            : this.period.number + 1,
        proposer: Math.random() < this.game.beta
            ? this.game.buyer_id 
            : this.game.seller_id,
        price: null,
        proposed_at: null,
        accepted: false,
        decided_at: null,
        show_up_2nd_buyer: this.game.exists_2nd_buyer && Math.random() < this.game.alpha
    }

    this.toBoth(EVENT.NEW_PERIOD, this.period)
    return true;
}

Dealer.prototype.propose = function () {
    this.io.to(this.opponent).emit(EVENT.PROPOSE, this.period);
}

Dealer.prototype.endPeriod = async function () {
    this.toBoth(EVENT.DECIDE, this.period.accepted);
    if (this.period.proposer == this.self) {
        return;
    }
    await Assistant.savePeriod(this.game.id, this.period);
    if (this.period.accepted || !this.nextPeriod()) {
        await Assistant.endGame(this.game.id);
        this.newGame();
    }
}


exports.listen = (server) => {
    var io = socketio.listen(server);

    io.sockets.on('connection', (socket) => {

        var self, opponent, dealer;

        // initialization triggered once login
        socket.on(EVENT.LOGIN, async (id) => {
            self = id;
            var result = await Assistant.getOpponent(self);
            if (result.opponent) {
                opponent = result.opponent;
                dealer = new Dealer(self, opponent, io);
                socket.emit(EVENT.TEST, "Welcome! " + self + ". Your opponent is " + opponent);
            } else {
                socket.emit(EVENT.TEST, "Welcome! " + self + ". You have no opponent!");
            }
        });


        const opponentIsOnline = () => {
            return io.sockets.adapter.rooms[opponent] && opponent;
        }


        socket.on(EVENT.PROPOSE, (period) => {
            dealer.syncPeriod(period);
            dealer.propose();
        });

        socket.on(EVENT.READY, () => {
            socket.join(self);
            if (!opponentIsOnline()) {
                socket.emit(EVENT.WAIT, "Please wait!");
            } else {
                dealer.newGame();
            }
        });

        socket.on(EVENT.SYNC_GAME, (game) => {
            dealer.syncGame(game);
            dealer.startGame();
        });

        socket.on(EVENT.END_PERIOD, (period) => {
            dealer.syncPeriod(period);
            dealer.endPeriod();
        })

        socket.on('disconnect', () => {
            if (opponentIsOnline()) {
                io.to(opponent).emit(EVENT.LOST_OP, "Your opponent is lost.");
            }
        });

    });

    return io;
}
