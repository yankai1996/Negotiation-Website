var socketio = require('socket.io');
var System = require('../models/system');

exports.listen = (server) => {
    var io = socketio.listen(server);

    io.sockets.on('connection', (socket) => {

        var self, opponent;

        const opponentIsOnline = () => {
            return io.sockets.adapter.rooms[opponent];
        }

        socket.on('login', (id) => {
            self = id;
            System.getOpponent(self).then((result) => {
                if (result.opponent) {
                    opponent = result.opponent;
                    socket.emit('test', "Welcome! " + self + ". Your opponent is " + opponent);
                } else { 
                    socket.emit('test', "Welcome! " + self + ". You have no opponent!");
                }
            });
        });

        socket.on('warm up', (data) => {
            socket.join(self);
            if (!opponentIsOnline()){
                socket.emit('wait opponent', "Please wait!");
                return;
            }
            io.to(opponent).emit('start', "Hi I'm your opponent " + self + "!");
            socket.emit('start', "Let's start a warm-up Hahah!");
        });

        socket.on('disconnect', () => {
            if (opponentIsOnline()) {
                io.to(opponent).emit('lost opponent', "Your opponent is lost.");
            }
        });

    });

    return io;
}