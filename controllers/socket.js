const socketio = require('socket.io');
const Assistant = require('../models/assistant');
const Instructor = require('../models/instructor');
const auth = require('./auth');

const COMMAND = {
    AUTH: "cmd auth",
    AUTH_FAILED: "cmd auth failed",
	PAUSE: "cmd pause",
	RESUME: "cmd resume"
}
const EVENT = {
    COMPLETE: 'complete',
    DECISION: 'decision',
    END_PERIOD: 'end period',
    LEAVE_ROOM: 'leave room',
    NEW_GAME: 'new game',
    NEW_PERIOD: 'new period',
    OP_LOST: 'opponent lost',
    PROPOSE: 'propose',
    READY: 'ready',
    RESULT: 'result',
    TEST: 'test',
    WAIT: 'wait opponent',
}

function Supervisor(io) {
    this.io = io;
}

Supervisor.prototype.pauseAll = function () {
    this.io.emit(COMMAND.PAUSE);
    Instructor.pause();
}

Supervisor.prototype.resumeAll = function () {
    this.io.emit(COMMAND.RESUME);
    Instructor.resume();
}


function Dealer(buyer, seller, io) {
    this.buyer = buyer;
    this.seller = seller;
    this.io = io;
    this.game = null;
    this.period = null;

    this.ready = false;

    this.keepSendingInterval = null;
    this.buyerReceived = false;
    this.sellerReceived = false;
}

Dealer.prototype.toBuyer = function (event, data) {
    this.io.to(this.buyer).emit(event, data);
}

Dealer.prototype.toSeller = function (event, data) {
    this.io.to(this.seller).emit(event, data);
}

Dealer.prototype.toBoth = function (event, data) {
    this.toBuyer(event, data);
    this.toSeller(event, data);
}

Dealer.prototype.toOpponent = function (self, event, data) {
    var opponent = self == this.buyer ? this.seller : this.buyer;
    if (this.io.sockets.adapter.rooms[opponent]) {
        this.io.to(opponent).emit(event, data);
    } 
}

Dealer.prototype.keepSending = function (sendingFn, time) {
    this.buyerReceived = false;
    this.sellerReceived = false;
    sendingFn()
    this.keepSendingInterval = setInterval(() => {
        if (this.buyerReceived && this.sellerReceived) {
            clearInterval(this.keepSendingInterval)
        } else {
            sendingFn()
        }
    }, time)
}

Dealer.prototype.ackReceived = function (id) {
    if (this.buyer == id) {
        this.buyerReceived = true;
    } else if (this.seller == id) {
        this.sellerReceived = true;
    }
}

// get a new game
Dealer.prototype.newGame = async function () {
    var game = await Assistant.getNewGame(this.buyer);
    if (!game) {
        this.toBoth(EVENT.COMPLETE, "You have finished all the games.");
    } else {
        console.log("New Game: " + this.buyer + " " + this.seller);
        this.game = game;
        Assistant.deletePeriods(this.game.id);
        var gamesLeft = await Assistant.countUnfinishedGames(this.buyer) - 1;
        var tempInterval;
        const startGame = () => {
            if (!this.bothReady()) {
                return;
            } else {
                this.toBuyer(EVENT.NEW_GAME, {
                    game: this.game,
                    role: 'buyer',
                    gamesLeft: gamesLeft
                });
                this.toSeller(EVENT.NEW_GAME, {
                    game: this.game,
                    role: 'seller',
                    gamesLeft: gamesLeft
                });
                this.nextPeriod(true);
                clearInterval(tempInterval);
            }
        };
        tempInterval = setInterval(startGame, 1000);
        startGame();
        
    }
}

Dealer.prototype.bothReady = function () {
    return (this.io.sockets.adapter.rooms[this.buyer] 
        && this.io.sockets.adapter.rooms[this.seller]);
}

Dealer.prototype.getReady = function () {
    if (this.ready) {
        return;
    }
    this.ready = true;

    if (this.bothReady()) {
        setTimeout(() => {
            if (this.bothReady()){
                this.newGame();
            } else {
                this.ready = false;
            }
        }, 5000);
    } else {
        this.ready = false;
    }
    
}

Dealer.prototype.syncPeriod = function (period) {
    if (!this.period) {
        this.period = period;
    } else {
        for (i in this.period) {
            if (i != 'number' && i in period) {
                this.period[i] = period[i];
            }
        }
    }
}

// enter the next period
Dealer.prototype.nextPeriod = function (initial = false) {
    // if it has reached the end of the game
    if (!initial && this.period.number == this.game.t) {
        return false;
    }

    var random = Math.random();
    var proposerId = random < this.game.beta
        ? this.game.buyer_id 
        : this.game.seller_id;

    this.period = {
        number: initial 
            ? 1
            : this.period.number + 1,
        proposer_id: proposerId,
        proposer_role: proposerId == this.game.buyer_id
            ? 'buyer'
            : 'seller',
        price: null,
        proposed_at: null,
        accepted: false,
        decided_at: null,
        show_up_2nd_buyer: this.game.exists_2nd_buyer && Math.random() < this.game.alpha
    }

    this.toBoth(EVENT.NEW_PERIOD, this.period)
    this.ready = false;
    return true;
}

// send proposal to opponent
Dealer.prototype.propose = function () {
    if (this.bothReady()) {
        this.toBoth(EVENT.PROPOSE, this.period);
    }
}

// end one period
Dealer.prototype.endPeriod = async function () {
    this.toBoth(EVENT.DECISION, this.period);
    await Assistant.savePeriod(this.game.id, this.period);
    if (this.period.show_up_2nd_buyer || this.period.accepted || !this.nextPeriod()) {
        this.endGame();
    }
}

// end one game
Dealer.prototype.endGame = async function () {
    this.game.is_done = true;
    var result = await Assistant.endGame(this.game, this.period);
    
    const sendResult = () => {
        // console.log("Send Result")
        if (!this.bothReady()) {
            return;
        }
        this.toBuyer(EVENT.RESULT, {
            price: result.price,
            exists2ndBuyer: result.exists2ndBuyer,
            cost: result.cost,
            selfProfit: result.buyerProfit,
            opponentProfit: result.sellerProfit
        });
        this.toSeller(EVENT.RESULT, {
            price: result.price,
            exists2ndBuyer: result.exists2ndBuyer,
            cost: result.cost,
            selfProfit: result.sellerProfit,
            opponentProfit: result.buyerProfit
        });
    }

    this.keepSending(sendResult, 3000);

}


exports.listen = (server) => {

    var io = socketio.listen(server);

    var loggedIn = {};

    var dealers = {};

    var dealerKey = {}

    const initDealers = async () => {
        var pairs = await Instructor.getPairs();
        for (let i in pairs) {
            var buyer = pairs[i].buyer;
            var seller = pairs[i].seller;
            dealerKey[buyer] = i;
            dealerKey[seller] = i
            var dealer = new Dealer(buyer, seller, io);
            dealers[i] = dealer;
        }
        io.sockets.on('connection', initSocket);
    }

    initDealers();

    const initSocket = (socket) => {

        // initialization triggered once login
        socket.emit(COMMAND.AUTH, 'What is your ID?', async (data) => {
            // console.log(data);
            if (!id && auth.isInstructor(socket.request.headers.cookie)) {
                initInstructor();
                return;
            }

            var id = data.id;
            if (loggedIn[id]) {
                socket.emit(COMMAND.AUTH_FAILED, "You have logged in somewhere else!");
            } else {
                loggedIn[id] = true;
                var incomplete = await Assistant.existUnfinishedGames(id);
                if (!incomplete) {
                    socket.emit(EVENT.COMPLETE);
                } else {
                    sitDown(data);
                }
            }
        });


        const initInstructor = async () => {

            var instructor = new Supervisor(io);

            socket.on(COMMAND.PAUSE, () => {
                instructor.pauseAll();
            });
    
            socket.on(COMMAND.RESUME, () => {
                instructor.resumeAll();
            });
        }

        
        const sitDown = (data) => {

            if (!data || !data.id || !(data.id in dealerKey)) {
                return;
            }

            const id = data.id;
            var dealer = dealers[dealerKey[id]];

            if (data.waiting) {
                socket.join(id);
                dealer.getReady();
            } else if (data.inGame) {
                socket.join(id);
                dealer.game = dealer.game || data.game;
                dealer.syncPeriod(data.period);
            }

            // notified that the participant is ready to start the game
            socket.on(EVENT.READY, () => {
                socket.emit(EVENT.WAIT, "Looking for your opponent...");
                socket.join(id);
                dealer.getReady();
            });

            // received the proposal from the proposer
            socket.on(EVENT.PROPOSE, (period) => {
                var price = period.price;
                if (isNaN(price) || price <= 0 || price > 12) {
                    return;
                }
                dealer.syncPeriod(period);
                dealer.propose();
            });


            // received when decision is made or time is out
            socket.on(EVENT.END_PERIOD, (period, repsond) => {
                repsond(true);
                dealer.syncPeriod(period);
                if (dealer.bothReady()) {
                    dealer.endPeriod();
                }
            });

            socket.on(EVENT.RESULT, () => {
                socket.leave(id);
                dealer.ackReceived(id);
            })

            socket.on(EVENT.LEAVE_ROOM, () => {
                socket.leave(id);
                // console.log("LEAVE!!!!!!!")
            });

            socket.on('disconnect', () => {
                loggedIn[id] = false;
                setTimeout(() => {
                    if (!io.sockets.adapter.rooms[id]) {
                        dealer.toOpponent(id, EVENT.OP_LOST, "Your opponent is lost!")
                    }
                 }, 10000);
 
            });
        }
    };

    return io;
}
