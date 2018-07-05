var socketio = require('socket.io');
var Dealer = require('../models/dealer');

exports.listen = (server) => {
    var io = socketio.listen(server);

    io.sockets.on('connection', (socket) => {

        var self, opponent;

        const opponentIsOnline = () => {
            return io.sockets.adapter.rooms[opponent];
        }

        const startGame = (game) => {
            io.to(opponent).emit('start', "Hi I'm your opponent " + self + "!");
            socket.emit('start', "Let's start a warm-up Hahah!");
        }

        socket.on('login', async (id) => {
            self = id;
            var result = await Dealer.getOpponent(self);
            if (result.opponent) {
                opponent = result.opponent;
                socket.emit('test', "Welcome! " + self + ". Your opponent is " + opponent);
            } else { 
                socket.emit('test', "Welcome! " + self + ". You have no opponent!");
            }
        });

        socket.on('ready', (data) => {
            socket.join(self);
            if (!opponentIsOnline()){
                socket.emit('wait opponent', "Please wait!");
                return;
            }
            startGame();
            // Dealer.getWarmupGame(self).then((result) => {

            // })
        });

        socket.on('disconnect', () => {
            if (opponentIsOnline()) {
                io.to(opponent).emit('lost opponent', "Your opponent is lost.");
            }
        });

    });

    return io;
}