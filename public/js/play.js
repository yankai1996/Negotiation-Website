
$("#description").load("/html/description.html");

const ID = $("#welcome .title h1").text().slice(-4);

var $warmup = $("#warm-up")
  , $welcome = $("#welcome")
  , $game = $("#game")
  , $waiting = $("#waiting")
  , $waitingInfo = $("#waiting-info")
  ;

// default address: 'http://localhost'
var socket = io.connect();

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

socket.on("connect", () => {
	socket.emit("login", ID);
});

socket.on("test", (data) => {
	console.log(data);
});

socket.on('wait opponent', (data) => {
	waiting();
	console.log(data);
});

socket.on('start', (data) => {
	start();
	console.log(data);
});

socket.on('lost opponent', (data) => {
	waiting();
	console.log(data);
});


$warmup.click(() => {
	// waiting();
	socket.emit("ready", {
		msg: "I am ready!"
	});
});




$(".round").click(() => {
	$waiting.hide();
});