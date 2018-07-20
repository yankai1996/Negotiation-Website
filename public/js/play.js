
const ID = $("#welcome .title h1").text().slice(-4);
const EVENT = {
    COMPLETE: 'complete',
    DECIDE: 'decide',
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
}
const CLASS = {
	DISABLE: 'disable',
	RED: 'red',
	DONE: 'done'
}

var gPeriod = {};

var $accept = $("button#accept")
  , $accepted = $(".proposal.accepted")
  , $backdrops = $(".backdrop")
  , $boxes = $(".box")
  , $complete = $("#complete")
  , $continue = $("#continue")
  , $decision = $("#decision")
  , $description = $("#description")
  , $input = $(".input-box input")
  , $game = $("#game")
  , $operation = $(".operation")
  , $operationButtons = $(".button-box button")
  , $preparation = $("#preparation")
  , $progressRow = $("#progress-row")
  , $progressLabel = $("#progress-label")
  , $proposals = $(".input-box").children()
  , $propose = $("button#propose")
  , $proposed = $(".proposal.proposed")
  , $quit = $("#quit")
  , $refuse = $("button#refuse")
  , $refused = $(".proposal.refused")
  , $remainingTime = $(".remaining-time")
  , $second = $(".proposal.second")
  , $secondBuyer = $("#2nd-buyer")
  , $timer = $(".timer")
  , $time = $("#time")
  , $viewDescription = $("#view-description")
  , $waiting = $("#waiting")
  , $waitingInfo = $("#waiting-info")
  , $waitProposal = $("#wait-proposal")
  ,	$warmup = $("#warm-up")
  , $welcome = $("#welcome")
  ;



$description.load("/html/description.html");


// default address: 'http://localhost'
var socket = io.connect();
socket.on("connect", () => {
	socket.emit(EVENT.LOGIN, ID);
	console.log("connect!")
});


const timer = new function() {
	const time = 30;
	var count = time;

	this.start = () => {
		$remainingTime.animate({width: '0%'}, time*1000);
		this.set = setInterval(() => {
	        count--;
	        $time.html(('0' + count).slice(-2)); 
	        if (count == 10) {
	        	$timer.addClass(CLASS.RED);
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
	this.stop = () => {
		clearInterval(this.set);
		$remainingTime.stop();
		$waitProposal.stop();
	}
	this.reset = () => {
		this.stop();
		count = time;
		$time.html(time);
		$timer.removeClass(CLASS.RED);
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


const waiting = (info) => {
	info = info || "Waiting for your opponent...";
	$waitingInfo.html(info);
	$waiting.show();
}

const initOperations = () => {
	$operation.show();
	$proposals.hide();
}

const askProposal = () => {
	initOperations();
	$input.show();
	$input.val('');
	$operationButtons.hide();
	$propose.show();
	$propose.removeClass(CLASS.DISABLE);
}

const waitProposal = () => {
	initOperations();
	$waitProposal.show();
	$operationButtons.hide();
	$accept.show();
	$refuse.show();
	$operationButtons.addClass(CLASS.DISABLE);
}

const disableProposal = () => {
	$propose.addClass(CLASS.DISABLE);
	$input.hide();
	$proposed.html("Your proposal: $" +gPeriod.price);
	$proposed.show();
}

const askDecision = () => {
	$waitProposal.hide();
	$proposed.html("$" + gPeriod.price);
	$proposed.show();
	$operationButtons.removeClass(CLASS.DISABLE);
}

const getReady = () => {
	waiting();
	setTimeout(() => {
		socket.emit(EVENT.READY);
	}, 5000);
}

const showSecondBuyer = () => {
	if (gPeriod.show_up_2nd_buyer) {
		initOperations();
		$second.show();
		$secondBuyer.show();
		setTimeout(() => {
			socket.emit(EVENT.END_PERIOD, gPeriod);
		}, 5000);
		return true;
	}
	$secondBuyer.hide();
	return false;
}

const decide = (accepted) => {
	gPeriod.accepted = accepted;
	gPeriod.decided_at = timer.lap();
	socket.emit(EVENT.END_PERIOD, gPeriod);

	timer.stop();
	$operationButtons.addClass(CLASS.DISABLE);
}


socket.on(EVENT.COMPLETE, () => {
	gPeriod = {};
	$boxes.hide();
	$backdrops.hide();
	$complete.show();

	socket.disconnect()
});

socket.on(EVENT.DECIDE, (accepted) => {
	timer.stop();
	$proposals.hide();
	if (accepted) {
		$accepted.show();
	} else {
		$refused.show();
	}
});

socket.on(EVENT.LOST_OP, (data) => {
	waiting();
	timer.stop();
	console.log(data);
});

socket.on(EVENT.NEW_PERIOD, (period) => {
	gPeriod = period;

	$preparation.fadeOut(1000);

	setTimeout(() => {
		$progressRow.find('div').eq(period.number - 1).addClass(CLASS.DONE);
		var t = $progressLabel.html().split('/')[1];
		$progressLabel.html(period.number + "/" + t);

		if (!showSecondBuyer()) {
			if (period.proposer == ID) {
				askProposal();
			} else {
				waitProposal();
			}
			timer.restart();;
		}
	}, 1000);
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


$warmup.click(() => {
	getReady();
});

$continue.click(() => {
	getReady();
});

$viewDescription.click(() => {
	$description.slideToggle(500);
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
	if ($propose.hasClass(CLASS.DISABLE)) {
		return;
	}
	gPeriod.price = parseFloat($input.val());
	gPeriod.proposed_at = timer.lap();
	socket.emit(EVENT.PROPOSE, gPeriod);

	disableProposal();
});

$accept.click(() => {
	if ($accept.hasClass(CLASS.DISABLE)) {
		return;
	}
	decide(true);
});

$refuse.click(() => {
	if ($refuse.hasClass(CLASS.DISABLE)) {
		return;
	}
	decide(false);
});

$quit.click(() => {
	location.href = "/logout";
});





