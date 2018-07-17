
$("#description").load("/html/description.html");

const ID = $("#welcome .title h1").text().slice(-4);
const EVENT = {
    COMPLETE: 'complete',
    END_PERIOD: 'end period',
    LOGIN: 'login',
    LOST_OP: 'lost opponent',
    NEW_PERIOD: 'new period',
    PROPOSE: 'propose',
    READY: 'ready',
    START: 'start',
    SYNC_GAME: 'sync game',
    TEST: 'test',
    WAIT: 'wait opponent',
};

var gPeriod = {};

var $accept = $("#accept")
  , $boxes = $(".box")
  , $buttonBox = $(".button-box")
  , $complete = $("#complete")
  , $continue = $("#continue")
  , $decision = $("#decision")
  , $input = $("#proposal input")
  , $game = $("#game")
  , $operations = $(".operation")
  , $preparation = $("#preparation")
  , $progressRow = $("#progress-row")
  , $progressLabel = $("#progress-label")
  , $proposal = $("#proposal")
  , $propose = $("#propose")
  , $proposed = $(".proposed")
  , $refuse = $("#refuse")
  , $remainingTime = $(".remaining-time")
  , $secondBuyer = $("2nd-buyer")
  , $timer = $(".timer")
  , $time = $("#time")
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

const askProposal = () => {
	$operations.hide();
	$proposal.show();
	$proposed.hide();
	$input.show();
	$input.val('');
	$propose.removeClass('disable');
}

const waitProposal = () => {
	$operations.hide();
	$decision.show();
	$waitProposal.show();
	$proposed.hide();
	$buttonBox.find('button').addClass('disable');
}

const disableProposal = () => {
	$propose.addClass('disable');
	$input.hide();
	$proposed.html("Your proposal: $" +gPeriod.price);
	$proposed.show();
}

const askDecision = () => {
	$waitProposal.hide();
	$proposed.html("$" + gPeriod.price);
	$proposed.show();
	$buttonBox.find('button').removeClass('disable');
}

const timer = new function() {
	const time = 30;
	var count = time;

	this.start = () => {
		$remainingTime.animate({width: '0%'}, time*1000);
		this.set = setInterval(() => {
	        count--;
	        $time.html(('0' + count).slice(-2)); 
	        if (count == 10) {
	        	$timer.addClass('red');
	        }
	        $waitProposal.animate({
	        	backgroundColor: count % 2 ? '#fafafa' : '#eee'
	        }, 1000);
	        if (count == 0) {
	            this.reset();
	            socket.emit(EVENT.END_PERIOD, gPeriod);
	        }
	    }, 1000);

	}
	this.reset = () => {
		clearInterval(this.set);
		count = time;
		$remainingTime.stop();
		$waitProposal.stop();
		$time.html(time);
		$timer.removeClass('red');
		$remainingTime.css('width', '100%');
	}
	this.restart = () => {
		this.reset();
		this.start();
	}
	this.lap = () => {
		return time - count;
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

socket.on(EVENT.NEW_PERIOD, (period) => {
	gPeriod = period;
	$progressRow.find('div').eq(period.number - 1).addClass('done');
	var t = $progressLabel.html().split('/')[1];
	$progressLabel.html(period.number + "/" + t);
	// if (period.show_up_2nd_buyer) {
	// 	$secondBuyer.show()
	// }

	var delay = period.number == 1 ? 1000 : 0;
	$preparation.fadeOut(1000);
	setTimeout(() => {
		if (period.proposer == ID) {
			askProposal();
		} else {
			waitProposal();
		}
		timer.restart();;
	}, delay);
});

socket.on(EVENT.PROPOSE, (period) => {
	gPeriod = period;
	askDecision();
})

socket.on(EVENT.START, (params) => {
	$boxes.hide();
	$waiting.hide();
	$secondBuyer.hide();
	$game.show();

	for (let i in params) {
		$("." + i).html(params[i]);
	}
	$preparation.fadeIn(1000);
	$progressLabel.html("1/" + params.t)
	$progressRow.children().slice(2).detach();
	for (let i = 0; i < params.t; i++) {
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

const getReady = () => {
	waiting();
	setTimeout(() => {
		socket.emit(EVENT.READY);
	}, 5000);
}

$warmup.click(() => {
	getReady();
	// socket.emit(EVENT.READY);
});

$continue.click(() => {
	getReady();
});

$input.keypress((event) => {
	var theEvent = event || window.event;
    var key = theEvent.keyCode || theEvent.which;
    key = String.fromCharCode(key);
    var regex = /[0-9]|\./;
    if(!regex.test(key)) {
        theEvent.returnValue = false;
        if (theEvent.preventDefault) {
        	theEvent.preventDefault();
        }
    }
});

$propose.click(() => {
	if ($propose.hasClass('disable')) {
		return;
	}
	gPeriod.price = parseFloat($input.val());
	gPeriod.proposed_at = timer.lap();
	socket.emit(EVENT.PROPOSE, gPeriod);

	disableProposal();
});

const decide = (accepted) => {
	gPeriod.accepted = accepted;
	gPeriod.decided_at = timer.lap();
	socket.emit(EVENT.END_PERIOD, gPeriod);

	timer.reset();
	$buttonBox.find('button').addClass('disable');
}

$accept.click(() => {
	if ($accept.hasClass('disable')) {
		return;
	}
	decide(true);
});

$refuse.click(() => {
	if ($refuse.hasClass('disable')) {
		return;
	}
	decide(false);
});



