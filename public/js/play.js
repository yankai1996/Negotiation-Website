$(function(){

const ID = $("#participant-id").text();
const EVENT = {
    COMPLETE: 'complete',
    END_PERIOD: 'end period',
    LEAVE_ROOM: 'leave room',
    LOGIN: 'login',
    LOST_OP: 'lost opponent',
    NEW_PERIOD: 'new period',
    PROPOSE: 'propose',
    READY: 'ready',
    RESULT: 'decide',
    START: 'start',
    SYNC_GAME: 'sync game',
    TEST: 'test',
    WAIT: 'wait opponent',
    WARMED_UP: 'warmed up'
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
  , $completePage = $("#complete-page")
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
  ;


var timer = new function() {
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
	            this.stop();
	            endPeriod();
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


var socket = io.connect();
socket.on(EVENT.LOGIN, (data, respond) => {
	respond(ID);
})


const waiting = (info) => {
	info = info || "Waiting for your opponent...";
	$waitingInfo.html(info);
	$waiting.show();
}

const initOperations = () => {
	$operation.show();
	$input.hide();
	$proposal.hide();
	$operationButtons.hide();
}

const askProposal = () => {
	$input.show();
	$input.val('');
	$propose.show();
	$propose.removeClass(CLASS.DISABLE);
}

const waitProposal = () => {
	showProposal('WAIT');
	$accept.show();
	$refuse.show();
	$operationButtons.addClass(CLASS.DISABLE);
}

const disableProposal = () => {
	$propose.addClass(CLASS.DISABLE);
	showProposal("Your proposal: $" + gPeriod.price);
}

const askDecision = () => {
	showProposal("$" + gPeriod.price);
	$operationButtons.removeClass(CLASS.DISABLE);
	$proposal.stop();
	$proposal.css('backgroundColor', '#eee');
}

const getReady = () => {
	waiting();
	setTimeout(() => {
		socket.emit(EVENT.READY);
	}, 5000);
}

const isMyTurn = () => {
	if (gPeriod.proposer == ID && gPeriod.price == null) {
		return true;
	}
	if (gPeriod.proposer != ID && gPeriod.price != null) {
		return true;
	}
	return false;
}

const endPeriod = () => {
	if (isMyTurn()) {
		socket.emit(EVENT.END_PERIOD, gPeriod);
	}
}

const decide = (accepted) => {
	gPeriod.accepted = accepted;
	gPeriod.decided_at = timer.lap();
	endPeriod();

	timer.stop();
	$operationButtons.addClass(CLASS.DISABLE);
}

// show proposal information
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


// all games have been completed
socket.on(EVENT.COMPLETE, () => {
	gPeriod = {};
	$boxes.hide();
	$backdrops.hide();
	$completePage.show();

	socket.disconnect()
});

// receiving the result of the current period
socket.on(EVENT.RESULT, (period) => {
	timer.stop();
	gPeriod = {};
	if (period.show_up_2nd_buyer) {
		showProposal('SECOND');
		$secondBuyer.show();
	} else if (period.accepted) {
		showProposal('ACCEPTED');
	} else if (period.decided_at) {
		showProposal('REFUSED');
	} else {
		showProposal('NONE');
	}
});

socket.on(EVENT.LOST_OP, (info) => {
	waiting(info);
	timer.stop();
});

socket.on(EVENT.NEW_PERIOD, (period) => {
	gPeriod = period;

	$preparation.fadeOut(1000);

	setTimeout(() => {
		$progressRow.find('div').eq(period.number - 1).addClass(CLASS.DONE);
		var t = $progressLabel.html().split('/')[1];
		$progressLabel.html(period.number + "/" + t);
		timer.reset();
		initOperations();

		if (period.show_up_2nd_buyer) {
			endPeriod();
		} else if (period.proposer == ID) {
			askProposal();
			timer.start();
		} else {
			waitProposal();
			timer.start();
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
	$operation.hide();
	$game.show();

	for (let i in params) {
		$("." + i).html(params[i]);
	}
	$preparation.fadeIn(1000);
	$progressLabel.html("0/" + params.t)
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

socket.on(EVENT.WAIT, (info) => {
	waiting(info);
});

socket.on(EVENT.WARMED_UP, () => {
	$("#game").hide();
	$("#welcome-page").show();
	$("#welcome").hide();
	$("#good-job").show();
    $("#welcome-info").hide();
	$("#continue-info").hide();
	$("#good-job-info").show();
	$warmup.hide();
	$description.hide();
	$viewDescription.show();
	$continue.show();

	socket.emit(EVENT.LEAVE_ROOM);
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
	var price = parseFloat($input.val());
	if (isNaN(price) || price < 0) {
		return;
	}
	gPeriod.price = price;
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


});


