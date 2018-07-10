var socketio = require('socket.io');
var Dealer = require('../models/dealer');

const EVENT = {
    LOGIN: 'login',
    READY: 'ready',
    START: 'start',
    TEST: 'test',
    WAIT: 'wait opponent',
}

exports.listen = (server) => {
    var io = socketio.listen(server);

    io.sockets.on('connection', (socket) => {

        var self, opponent;

        const opponentIsOnline = () => {
            return io.sockets.adapter.rooms[opponent];
        }

        const startGame = (game) => {
            io.to(opponent).emit(EVENT.START, "Hi I'm your opponent " + self + "!");
            socket.emit(EVENT.START, "Let's start a warm-up Hahah!");
        }

        socket.on(EVENT.LOGIN, async (id) => {
            self = id;
            var result = await Dealer.getOpponent(self);
            if (result.opponent) {
                opponent = result.opponent;
                socket.emit(EVENT.TEST, "Welcome! " + self + ". Your opponent is " + opponent);
            } else { 
                socket.emit(EVENT.TEST, "Welcome! " + self + ". You have no opponent!");
            }
        });

        socket.on(EVENT.READY, (data) => {
            socket.join(self);
            if (!opponentIsOnline()){
                socket.emit(EVENT.WAIT, "Please wait!");
            } else {
                startGame();
            }
        });

        socket.on('disconnect', () => {
            if (opponentIsOnline()) {
                io.to(opponent).emit('lost opponent', "Your opponent is lost.");
            }
        });

    });

    return io;
}

exports.EVENT = EVENT;