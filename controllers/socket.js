var socketio = require('socket.io');
var Assistant = require('../models/assistant');

const EVENT = {
    COMPLETE: 'complete',
    LOGIN: 'login',
    LOST_OP: 'lost opponent',
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
    this.game = null;
}

Dealer.prototype.toBuyer = function (event, data) {
    this.io.to(this.game.buyer_id).emit(event, data);
}

Dealer.prototype.toSeller = function (event, data) {
    this.io.to(this.game.seller_id).emit(event, data);
}

Dealer.prototype.newGame = async function () {
    var newGame = await Assistant.getNewGame(this.self);
    if (!newGame) {
        this.toBuyer(EVENT.COMPLETE, "You have finished all the games.");
        this.toSeller(EVENT.COMPLETE, "You have finished all the games.");
    } else {
        this.game = newGame;
        this.io.to(this.opponent).emit(EVENT.SYNC_GAME, this.game);
    }
}

Dealer.prototype.syncGame = function (game) {
    this.game = game;
}

Dealer.prototype.startGame = function () {
    var propose = Math.random() < this.game.beta;
    var secondBuyer = this.game.exists_2nd_buyer && Math.random() < this.game.alpha;
    this.toBuyer(EVENT.START, {
        alpha: this.game.alpha,
        beta: this.game.beta,
        gamma: this.game.gamma,
        t: this.game.t,
        w: this.game.w,
        period: 1,
        propose: propose,
        secondBuyer: secondBuyer
    });
    this.toSeller(EVENT.START, {
        alpha: this.game.alpha,
        beta: this.game.beta,
        gamma: this.game.gamma,
        t: this.game.t,
        w: this.game.w,
        period: 1,
        propose: !propose,
        secondBuyer: secondBuyer
    });
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

        socket.on('disconnect', () => {
            if (opponentIsOnline()) {
                io.to(opponent).emit(EVENT.LOST_OP, "Your opponent is lost.");
            }
        });

    });

    return io;
}
