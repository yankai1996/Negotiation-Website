var socketio = require('socket.io');
var Assistant = require('../models/assistant');

const EVENT = {
    COMPLETE: 'complete',
    END_PERIOD: 'end period',
    LOGIN: 'login',
    LOST_OP: 'lost opponent',
    NEW_PERIOD: 'new period',
    PROPOSE: 'propose',
    READY: 'ready',
    START: 'start',
    SYNC_GAME: 'sync game',
    SYNC_PERIOD: 'sync period',
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
    var newGame = await Assistant.getNewGame(this.self);
    if (!newGame) {
        this.toBoth(EVENT.COMPLETE, "You have finished all the games.");
    } else {
        this.game = newGame;
        this.io.to(this.opponent).emit(EVENT.SYNC_GAME, this.game);
    }
}

Dealer.prototype.initPeriod = function () {
    this.period = {
        number: 0,
        proposer: null,
        price: null,
        proposed_at: null,
        accepted: false,
        decided_at: null,
        show_up_2nd_buyer: false
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
    this.initPeriod();
    this.nextPeriod();
}

Dealer.prototype.nextPeriod = function () {
    var propose = Math.random() < this.game.beta;
    var secondBuyer = this.game.exists_2nd_buyer && Math.random() < this.game.alpha;

    if (this.period.number == this.game.t) {
        console.log("end");
        return false;
    }

    this.period.number++;
    this.period.proposer = propose ? this.game.buyer_id : this.game.seller_id; 
    this.period.show_up_2nd_buyer = secondBuyer

    this.toBoth(EVENT.NEW_PERIOD, this.period)
    // this.toBuyer(EVENT.NEW_PERIOD, {
    //     periodNumber: this.period.number,
    //     propose: propose,
    //     secondBuyer: secondBuyer
    // });
    // this.toSeller(EVENT.NEW_PERIOD, {
    //     periodNumber: this.period.number,
    //     propose: !propose,
    //     secondBuyer: secondBuyer
    // });

    return true;
}

Dealer.prototype.recordPeriod = function (data) {
    for (let i in this.period) {
        if (data[i] !== undefined) {
            this.period[i] = data[i];
        }
    }
}

Dealer.prototype.propose = function (price) {
    this.io.to(this.opponent).emit(EVENT.PROPOSE, this.period.price);
}

Dealer.prototype.endPeriod = function () {

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


        socket.on(EVENT.PROPOSE, (data) => {
            dealer.recordPeriod(data);
            dealer.propose(data.price);
        });

        socket.on(EVENT.READY, (data) => {
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

        socket.on(EVENT.SYNC_PERIOD, (period) => {
            dealer.syncPeriod(period);
        })

        socket.on(EVENT.END_PERIOD, (data) => {
            dealer.recordPeriod(data)
            if (!dealer.nextPeriod()) {
                dealer.newGame();
            }
        })

        socket.on('disconnect', () => {
            if (opponentIsOnline()) {
                io.to(opponent).emit(EVENT.LOST_OP, "Your opponent is lost.");
            }
        });

    });

    return io;
}
