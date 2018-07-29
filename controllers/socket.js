var socketio = require('socket.io');
var Assistant = require('../models/assistant');

const EVENT = {
    COMPLETE: 'complete',
    DECIDE: 'decide',
    END_PERIOD: 'end period',
    LEAVE_ROOM: 'leave room',
    LOGIN: 'login',
    LOST_OP: 'lost opponent',
    NEW_PERIOD: 'new period',
    PROPOSE: 'propose',
    READY: 'ready',
    START: 'start',
    SYNC_GAME: 'sync game',
    TEST: 'test',
    WAIT: 'wait opponent',
    WARMED_UP: 'warmed up'
}


function Dealer(self, opponent, io) {
    this.self = self;
    this.opponent = opponent;
    this.io = io;
    this.game = {};
    this.period = {};
    this.complete = false;
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

// get a new game
Dealer.prototype.newGame = async function (game) {
    if (game === undefined) {
        game = await Assistant.getNewGame(this.self);
    }
    if (!game) {
        this.complete = true;
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

// start the game
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

// enter the next period
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

// send proposal to opponent
Dealer.prototype.propose = function () {
    this.io.to(this.opponent).emit(EVENT.PROPOSE, this.period);
}

// end one period
Dealer.prototype.endPeriod = async function () {
    if (!this.period.show_up_2nd_buyer) {
        this.toBoth(EVENT.DECIDE, {
            accepted: this.period.accepted,
            decided_at: this.period.decided_at
        });
    }
    await Assistant.savePeriod(this.game.id, this.period);
    if (this.period.show_up_2nd_buyer || this.period.accepted || !this.nextPeriod()) {
        this.endGame();
    }
}

// end one game
Dealer.prototype.endGame = async function () {
    await Assistant.endGame(this.game, this.period);
    var nextGame = await Assistant.getNewGame(this.self);
    setTimeout(() => {
        if (this.game.is_warmup) {
            this.toBoth(EVENT.WARMED_UP);
        } else if (!nextGame) {
            this.toBoth(EVENT.COMPLETE, "You have finished all the games.");
        } else {
            this.toBoth(EVENT.WAIT, "Waiting for your next opponent...")
            setTimeout(() => {
                this.newGame(nextGame);
            }, 5000);
        }
    }, 1000);
}

// if all the games have been finished
Dealer.prototype.isComplete = function () {
    return this.complete;
}


exports.listen = (server) => {
    var io = socketio.listen(server);

    io.sockets.on('connection', (socket) => {

        var self, opponent, dealer;

        // initialization triggered once login
        socket.emit(EVENT.LOGIN, 'What is your ID?', async (id) => {
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

        // check if the opponent is online
        const opponentIsOnline = () => {
            return opponent && io.sockets.adapter.rooms[opponent];
        }

        // received the proposal from the proposer
        socket.on(EVENT.PROPOSE, (period) => {
            dealer.syncPeriod(period);
            dealer.propose();
        });

        // notified that the participant is ready to start the game
        socket.on(EVENT.READY, () => {
            socket.join(self);
            if (!opponentIsOnline()) {
                socket.emit(EVENT.WAIT, "Waiting for your opponent...");
            } else {
                dealer.newGame();
            }
        });

        // sync the game from the opponent dealer
        socket.on(EVENT.SYNC_GAME, (game) => {
            dealer.syncGame(game);
            dealer.startGame();
        });

        // received when decision is made or time is out
        socket.on(EVENT.END_PERIOD, (period) => {
            dealer.syncPeriod(period);
            dealer.endPeriod();
        });

        socket.on(EVENT.LEAVE_ROOM, () => {
            socket.leave(self);
        })

        socket.on('disconnect', () => {
            if (!dealer.isComplete() && opponentIsOnline()) {
                io.to(opponent).emit(EVENT.LOST_OP, "Your opponent is lost!");
            }
        });

    });

    return io;
}
