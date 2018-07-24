
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
const INFO = {
	ACCEPTED: "Proposal Accpeted!",
	NONE: "No Agreement!",
	REFUSED: "Proposal Refused!",
	SECOND: "2nd Buyer Offered!",
	WAIT: 'Waiting for proposal...'
}
const CLASS = {
	ACCEPTED: 'accepted',
	DISABLE: 'disable',
	NONE: 'refused',
	RED: 'red',
	REFUSED: 'refused',
	PROPOSAL: 'proposal',
	SECOND: 'second',
	WAIT: 'wait',
	DONE: 'done'
}

var gPeriod = {};

var $accept = $("button#accept")
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
  , $proposal = $(".proposal")
  , $propose = $("button#propose")
  , $quit = $("#quit")
  , $refuse = $("button#refuse")
  , $remainingTime = $(".remaining-time")
  , $secondBuyer = $("#2nd-buyer")
  , $timer = $(".timer")
  , $time = $("#time")
  , $viewDescription = $("#view-description")
  , $waiting = $("#waiting")
  , $waitingInfo = $("#waiting-info")
  ,	$warmup = $("#warm-up")
  , $welcome = $("#welcome")
  ;


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
	        if ($proposal.hasClass(CLASS.WAIT)) {
	        	$proposal.animate({
		        	backgroundColor: count % 2 ? '#fafafa' : '#eee'
		        }, 1000);
	        }
	        if (count == 0) {
	            this.reset();
	            socket.emit(EVENT.END_PERIOD, gPeriod);
	        }
	    }, 1000);

	}
	this.stop = () => {
		clearInterval(this.set);
		$remainingTime.stop();
	}
	this.reset = () => {
		this.stop();
		count = time;
		$time.html(time);
		$timer.removeClass(CLASS.RED);
		$remainingTime.css('width', '100%');
	}
	this.lap = () => {
		return time - count;
	}
}


$description.load("/html/description.html");


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

const isMyTurn = () => {
	
}

const initOperations = () => {
	$operation.show();
	$input.hide();
	$proposal.hide();
	$operationButtons.hide();
}

const askProposal = () => {
	initOperations();
	$input.show();
	$input.val('');
	$propose.show();
	$propose.removeClass(CLASS.DISABLE);
}

const waitProposal = () => {
	initOperations();
	showProposal('WAIT');
	$accept.show();
	$refuse.show();
	$operationButtons.addClass(CLASS.DISABLE);
}

const disableProposal = () => {
	$proposal.stop();
	$proposal.css('backgroundColor', '#eee');
	$propose.addClass(CLASS.DISABLE);
	showProposal("Your proposal: $" + gPeriod.price);
}

const askDecision = () => {
	showProposal("$" + gPeriod.price);
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
		showProposal('SECOND');
		$secondBuyer.show();
		setTimeout(() => {
			socket.emit(EVENT.END_PERIOD, gPeriod);
		}, 3000);
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

const showProposal = (info) => {
	$input.hide();
	$proposal.attr('class', CLASS.PROPOSAL);
	if (CLASS[info]) {	
		$proposal.addClass(CLASS[info]);
		$proposal.html(INFO[info]);
	} else {
		$proposal.html(info);
	}
	$proposal.show();
}


socket.on(EVENT.COMPLETE, () => {
	gPeriod = {};
	$boxes.hide();
	$backdrops.hide();
	$complete.show();

	socket.disconnect()
});

socket.on(EVENT.DECIDE, (decision) => {
	timer.stop();
	console.log(decision);
	if (decision.accepted) {
		showProposal('ACCEPTED');
	} else if (decision.decided_at) {
		showProposal('REFUSED');
	} else {
		showProposal('NONE');
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
		timer.reset();

		if (!showSecondBuyer()) {
			if (period.proposer == ID) {
				askProposal();
			} else {
				waitProposal();
			}
			timer.start();;
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





