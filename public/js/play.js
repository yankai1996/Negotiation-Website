
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

function Timer(time=30) {
	this.time = time;
	this.start = () => {
		var $time = $("#time");
		var $waitInput = $(".wait-input");
		var count = this.time;
		$(".remaining-time").animate({width: '0%'}, time*1000);
		this.set = setInterval(() => {
	        count--;
	        $time.html(('0'+count).slice(-2)); 
	        if (count == 10) {
	        	$time.css('color', 'red');
	        	$(".remaining-time").animate({backgroundColor: '#000'}, 1000);
	        }
	        if (count % 2 == 1) {
	        	$waitInput.animate({backgroundColor: '#fafafa'}, 1000);
	        } else {
	        	$waitInput.animate({backgroundColor: '#eee'}, 1000);
	        }
	        if (count === 0) {
	            clearInterval(this.set);
	        }
	    }, 1000);

	}
	this.reset = () => {
		clearInterval(this.set);
		var $time = $("#time");
		$time.html(this.time);
		$time.css('color', '#000');
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
