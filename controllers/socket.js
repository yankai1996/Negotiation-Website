var socketio = require('socket.io');
var System = require('../models/system');

exports.listen = (server) => {
    var io = socketio.listen(server);

    io.sockets.on("connection", (socket) => {

        var self, opponent;

        socket.on("login", (id) => {
            self = id;
            System.getOpponent(self).then((result) => {
                if (result.opponent) {
                    opponent = result.opponent;
                    socket.emit("test", "Welcome! " + self + ". Your opponent is " + opponent);
                } else { 
                    socket.emit("test", "Welcome! " + self + ". You have no opponent!");
                }
            });
        });

        socket.on('warm up', (data) => {
            console.log(data.msg);
            socket.emit("test", "Let's start a warm-up Hahah!")
        });



    });

    return io;
}