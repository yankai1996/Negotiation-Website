
$("#description").load("/html/description.html");

const ID = $("#welcome .title h1").text().slice(-4);
const EVENT = {
	LOGIN: 'login',
    READY: 'ready',
    START: 'start',
    TEST: 'test',
    WAIT: 'wait opponent',
}

var $warmup = $("#warm-up")
  , $welcome = $("#welcome")
  , $game = $("#game")
  , $waiting = $("#waiting")
  , $waitingInfo = $("#waiting-info")
  ;

// default address: 'http://localhost'
var socket = io.connect();
socket.on("connect", () => {
	socket.emit(EVENT.LOGIN, ID);
});


const waiting = (info) => {
	info = info || "Waiting for your opponent...";
	$waitingInfo.html(info);
	$waiting.show();
}

const start = () => {
	$waiting.hide();
	$welcome.hide();
	$game.show();
}



socket.on(EVENT.TEST, (data) => {
	console.log(data);
});

socket.on(EVENT.WAIT, (data) => {
	waiting();
	console.log(data);
});

socket.on(EVENT.START, (data) => {
	start();
	console.log(data);
});

socket.on('lost opponent', (data) => {
	waiting();
	console.log(data);
});


$warmup.click(() => {
	console.log("I'm ready")
	socket.emit("ready", {
		msg: "I am ready!"
	});
});




$(".round").click(() => {
	$waiting.hide();
});
