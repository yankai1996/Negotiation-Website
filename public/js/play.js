
$("#description").load("/html/description.html");

const ID = $("#welcome .title h1").text().slice(-4);
const EVENT = {
    COMPLETE: 'complete',
    END_PERIOD: 'end period',
    LOGIN: 'login',
    LOST_OP: 'lost opponent',
    NEW_PERIOD: 'new period',
    READY: 'ready',
    START: 'start',
    SYNC_GAME: 'sync game',
    TEST: 'test',
    WAIT: 'wait opponent',
}


var $boxes = $(".box")
  , $buttonBox = $(".button-box")
  , $complete = $("#complete")
  , $decision = $("#decision")
  , $game = $("#game")
  , $params = $(".params")
  , $progressRow = $("#progress-row")
  , $progressLabel = $("#progress-label")
  , $proposal = $("#proposal")
  , $proposed = $("#proposed")
  , $secondBuyer = $("2nd-buyer")
  , $waiting = $("#waiting")
  , $waitingInfo = $("#waiting-info")
  , $waitProposal = $("#wait-proposal")
  ,	$warmup = $("#warm-up")
  , $welcome = $("#welcome")
  ;

// default address: 'http://localhost'

var socket = io.connect();
socket.on("connect", () => {
	socket.emit(EVENT.LOGIN, ID);
	console.log("connect!")
});



const waiting = (info) => {
	info = info || "Waiting for your opponent...";
	$waitingInfo.html(info);
	$waiting.show();
}

const proposal = () => {
	$decision.hide();
	$proposal.show();
}

const waitProposal = () => {
	$proposal.hide();
	$decision.show();
	$waitProposal.show();
	$proposed.hide();
	$buttonBox.find('button').addClass('disable');
}

const timer = new function(time=30) {
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
				clearInterval(this.set);
	            this.reset();
	            socket.emit(EVENT.END_PERIOD, {

	            });
	        }
	    }, 1000);

	}
	this.reset = () => {
		this.$remainingTime.stop();
		this.$waitProposal.stop();
		this.$time.html(this.time);
		this.$timer.removeClass('red');
		this.$remainingTime.css('width', '100%');
	}
	this.restart = () => {
		this.reset();
		this.start();
	}
}


socket.on(EVENT.COMPLETE, () => {
	$boxes.hide();
	$complete.show();
});

socket.on(EVENT.LOST_OP, (data) => {
	waiting();
	console.log(data);
});

socket.on(EVENT.NEW_PERIOD, (data) => {
	if (data.secondBuyer) {
		$secondBuyer.show()
	}
	if (data.propose) {
		proposal();
	} else {
		waitProposal();
	}


	timer.restart();
});

socket.on(EVENT.START, (data) => {
	$boxes.hide();
	$waiting.hide();
	$secondBuyer.hide();
	$game.show();

	for (let i in data) {
		$params.find("#" + i).html(data[i]);
	}

	$progressLabel.html("1/" + data.t)
	$progressRow.children().slice(3).detach();
	for (let i = 0; i < data.t; i++) {
		$progressRow.append("<td><div></div></td>");
	}
});

socket.on(EVENT.SYNC_GAME, (game) => {
	console.log(game);
	socket.emit(EVENT.SYNC_GAME, game);
});

socket.on(EVENT.TEST, (data) => {
	console.log(data);
});

socket.on(EVENT.WAIT, (data) => {
	waiting();
	console.log(data);
});





socket.on('disconnect', () => {
	socket.disconnect();
	console.log("disconnect!!")
})

$warmup.click(() => {
	socket.emit(EVENT.READY);
});


// $(".round").click(() => {
// 	$waiting.hide();
// });
