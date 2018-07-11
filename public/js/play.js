
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

// var socket = io.connect();
// socket.on("connect", () => {
// 	socket.emit(EVENT.LOGIN, ID);
// });

var socket = io();


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

function Timer(time=30) {
	this.time = time;
	this.$timer = $(".timer");
	this.$time = $("#time");
	this.$waitProposal = $("#wait-proposal");
	this.$remainingTime = $(".remaining-time");

	this.start = () => {
		var count = this.time;
		this.$remainingTime.animate({width: '0%'}, this.time*1000);
		this.set = setInterval(() => {
	        count--;
	        this.$time.html(('0'+count).slice(-2)); 
	        if (count == 10) {
	        	this.$timer.addClass('red');
	        }
	        if (count % 2 == 1) {
	        	this.$waitProposal.animate({backgroundColor: '#fafafa'}, 1000);
	        } else {
	        	this.$waitProposal.animate({backgroundColor: '#eee'}, 1000);
	        }
	        if (count === 0) {
	            this.reset();
	        }
	    }, 1000);

	}
	this.reset = () => {
		clearInterval(this.set);
		this.$remainingTime.stop();
		this.$waitProposal.stop();
		this.$time.html(this.time);
		this.$timer.removeClass('red');
		this.$remainingTime.css('width', '100%');
	}
}
var timer = new Timer();
timer.start();



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

socket.on('disconnect', () => {
	socket.disconnect();
})

$warmup.click(() => {
	console.log("I'm ready")
	socket.emit("ready", {
		msg: "I am ready!"
	});
});




$(".round").click(() => {
	$waiting.hide();
});
