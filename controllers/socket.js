var socketio = require('socket.io');

exports.listen = (server) => {
    var io = socketio.listen(server);

    io.sockets.on("connection", (socket) => {

        var id;
        socket.on("login", (data) => {
            id = data.id;
        });

        socket.on('warm up', (data) => {
            console.log(data.msg);
            socket.emit("test", "welcom! " + id);
        });



    });

    return io;
}