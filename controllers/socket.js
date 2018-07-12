var socketio = require('socket.io');
var Assistant = require('../models/assistant');

const EVENT = {
    LOGIN: 'login',
    READY: 'ready',
    START: 'start',
    TEST: 'test',
    WAIT: 'wait opponent',
}

function Dealer(buyer, seller, io){
    this.buyer = buyer;
    this.seller = seller;
    this.io = io;
}

Dealer.prototype.toBuyer = function(event, data){
    this.io.to(this.buyer).emit(event, data);
}

Dealer.prototype.toSeller = function(event, data){
    this.io.to(this.seller).emit(event, data);
}

Dealer.prototype.start = function(){
    this.toBuyer(EVENT.START, "Hi I'm your opponent " + this.seller + "!");
    this.toSeller(EVENT.START, "Hi I'm your opponent " + this.buyer + "!")
}


exports.listen = (server) => {
    var io = socketio.listen(server);

    io.sockets.on('connection', (socket) => {

        var self, opponent;

        const opponentIsOnline = () => {
            return io.sockets.adapter.rooms[opponent] && opponent;
        }

        const newGame = async () => {
            
        }

        socket.on(EVENT.LOGIN, async (id) => {
            self = id;
            var result = await Assistant.getOpponent(self);
            if (result.opponent) {
                opponent = result.opponent;
                socket.emit(EVENT.TEST, "Welcome! " + self + ". Your opponent is " + opponent);
            } else { 
                socket.emit(EVENT.TEST, "Welcome! " + self + ". You have no opponent!");
            }
        });

        socket.on(EVENT.READY, (data) => {
            socket.join(self);
            console.log(opponentIsOnline());
            if (!opponentIsOnline()){
                socket.emit(EVENT.WAIT, "Please wait!");
            } else {
                newGame();
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
