var socketio = require('socket.io');

exports.listen = (server) => {
    var io = socketio.listen(server);

    io.sockets.on("connection", (socket) => {

        socket.on("login", (data) => {
            console.log(data.id);
        });

        socket.on('warm up', (data) => {
            console.log(data.msg);
        });

    });

    return io;
}