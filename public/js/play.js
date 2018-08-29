$(function(){

const ID = $("#participant-id").text();
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
    SYNC_GAME: 'sync game',
    TEST: 'test',
    WAIT: 'wait opponent',
}
const INFO = {
	ACCEPTED: "Proposal Accpeted!",
	NONE: "No Agreement!",
	REJECTED: "Proposal Rejected!",
	SECOND: "2nd Buyer Offered!",
	WAIT: 'Waiting for proposal...'
}
const CLASS = {
	ACCEPTED: 'accepted',
	DISABLE: 'disable',
	DONE: 'done',
	GREEN: 'green',
	HIGHLIGHT: 'highlight',
	NONE: 'rejected',
	PROPOSAL: 'proposal',
	RED: 'red',
	REJECTED: 'rejected',
	SECOND: 'second',
	WAIT: 'wait',
}

// whether the player is in a period
var gPlaying = false;

// whether the player is waiting for opponent
var gWaitingOpponent;

// whether paused
var gPaused;

// whether the opponent is lost when paused
var gOpponentLost = false;

var $accept = $("button#accept")
  , $backdrops = $(".backdrop")
  , $boxes = $(".box")
  , $continue = $("#continue")
  , $description = $("#description")
  , $input = $(".input-box input")
  , $game = $("#game")
  , $gamesLeft = $("#games-left")
  , $loader = $(".loader")
  , $operation = $(".operation")
  , $operationButtons = $(".button-box button")
  , $preparation = $("#preparation")
  , $preparationTime = $(".preparation-time")
  , $progressRow = $("#progress-row")
  , $progressLabel = $("#progress-label")
  , $proposal = $(".proposal")
  , $propose = $("button#propose")
  , $questionMark = $(".question-mark")
  , $quit = $("#quit")
  , $ready = $(".ready")
  , $reject = $("button#reject")
  , $result = $("#result")
  , $role = $(".role")
  , $secondBuyer = $("#2nd-buyer")
  , $timeBar = $("td .time-bar")
  , $timeClock = $(".clock")
  , $timer = $(".timer")
  , $viewDescription = $("#view-description")
  , $waiting = $("#waiting")
  , $waitingInfo = $("#waiting-info")
  ,	$warmup = $("#warm-up")
  ;


const socket = io.connect();
socket.on(COMMAND.AUTH, (data, respond) => {
	console.log(data);
	respond(ID);
});

// timer for proposal and decision
const timer = new function() {

	const time = 60;
	var count = time;
	var started = false;

	this.start = function () {
		if (started || gPaused) {
			return;
		}

		started = true;
		$timeBar.animate({width: '0%'}, count * 1000);

		this.interval = setInterval(() => {
			count--;
			$timeClock.html(('0' + count).slice(-2)); 
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
				dealer.endPeriod();
			}
		}, 1000);
	}

	this.stop = function () {
		started = false;
		$timeBar.stop();
		clearInterval(this.interval);
	}

	this.reset = function () {
		this.stop();
		count = time;
		$timeClock.html(time);
		$timer.removeClass(CLASS.RED);
		$timeBar.css('width', '100%');
	}

	this.lap = function () {
		return time - count;
	}
}

// timer for preparation
const preparation = new function() {

	const time = 10;
	var count = time;
	var started = false;

	this.preparing = false;

	this.start = function () {
		if (started || gPaused) {
			return;
		}

		started = true;
		this.preparing = true;
		gWaitingOpponent = false;

		$boxes.hide();
		$game.show();
		$preparationTime.html(count);
		$preparation.fadeIn(1000);

		this.interval = setInterval(() => {
			count--;
			if (count > 0) {
				$preparationTime.html(count);
			} else if (count == 0) {
				$preparationTime.html("Start!");
				$preparation.fadeOut(1000);
			} else {
				this.reset();
				dealer.initPeriod();
			}
		}, 1000);
	}

	this.stop = function () {
		clearInterval(this.interval);
		started = false;
	}

	this.reset = function () {
		this.stop();
		count = time;
		this.preparing = false;
	}

}

const dealer = new function() {

	this.period = {};
	this.inGame = false;

	const isMyTurn = () => {
		if (this.period.proposer_id == ID && this.period.price == null) {
			return true;
		}
		if (this.period.proposer_id != ID && this.period.price != null) {
			return true;
		}
		return false;
	}

	const enableButton = ($button, listener) => {
		$button.show();
		$button.removeClass(CLASS.DISABLE);
		$button.click(listener);
	}

	const disableButton = ($buttons) => {
		$buttons.addClass(CLASS.DISABLE);
		$buttons.off("click");
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
		$operation.show();
		$proposal.show();
	}

	this.syncPeriod = (period) => {
		this.period = period;
	}

	this.initPeriod = () => {

		gPlaying = true;

		var $grids = $progressRow.find('div');
		$grids.eq(this.period.number - 1).addClass(CLASS.DONE);
		var $gridsDone = $progressRow.find('div.done');
		if ($grids.length - $gridsDone.length < 2) {
			$gridsDone.css('backgroundColor', '#f55');
		} else if ($gridsDone.length / $grids.length > 0.5) {
			$gridsDone.css('backgroundColor', '#fa0');
		}

		var t = $progressLabel.html().split('/')[1];
		$progressLabel.html(this.period.number + "/" + t);

		$operation.show();
		$input.hide();
		$proposal.hide();
		$operationButtons.hide();
		$timer.show();

		timer.reset();

		if (!this.period.show_up_2nd_buyer) {
			$questionMark.append('?').show();
		} else {
			$questionMark.html('').hide();
		}

		if (this.period.show_up_2nd_buyer) {
			this.endPeriod();
			return;
		} else if (this.period.proposer_id == ID) {
			$input.val('').show();
			enableButton($propose, btnListenr.propose);
		} else {
			showProposal('WAIT');
			$accept.show();
			$reject.show();
			disableButton($operationButtons);
		}
		timer.start();
	}

	this.propose = (price) => {
		this.period.price = price;
		this.period.proposed_at = timer.lap();
		timer.stop();
		disableButton($propose);
		showProposal("Your proposal: $" + this.period.price);
		socket.emit(EVENT.PROPOSE, this.period);
	}

	this.onProposal = (period) => {
		this.period = period;
		if (isMyTurn()) {
			showProposal("$" + this.period.price);
			enableButton($accept, btnListenr.accept);
			enableButton($reject, btnListenr.reject);
			$proposal.stop();
			$proposal.css('backgroundColor', '#eee');
		}
		timer.reset();
		timer.start();
	}

	this.decide = (accepted) => {
		this.period.accepted = accepted;
		this.period.decided_at = timer.lap();
		this.endPeriod();
		timer.stop();
		disableButton($operationButtons);
	}

	this.onDecision = (period) => {
		this.period = period;
		timer.stop();
		disableButton($operationButtons);
		if (this.period.show_up_2nd_buyer) {
			showProposal('SECOND');
			$secondBuyer.show();
		} else if (this.period.accepted) {
			showProposal('ACCEPTED');
		} else if (this.period.decided_at) {
			showProposal('REJECTED');
		} else {
			showProposal('NONE');
		}
	}

	this.endPeriod = () => {
		if (isMyTurn()) {
			socket.emit(EVENT.END_PERIOD, this.period);
		}
	}

}

const waiting = (info) => {
	info = info || "Looking for your opponent...";
	$waitingInfo.html(info)
	$waiting.show();
}


socket.on(EVENT.COMPLETE, () => {
	location.href = "/play/complete";
});

socket.on(EVENT.DECISION, dealer.onDecision);

socket.on(EVENT.OP_LOST, (info) => {
	if (!gPaused) {
		waiting(info);
		timer.stop();
		preparation.stop();
		setTimeout(() => {
			waiting("Looking for another opponent...")
		}, 2000);
	} else {
		socket.emit(EVENT.LEAVE_ROOM);
		gOpponentLost = true;
	}
});

socket.on(EVENT.NEW_GAME, (data) => {

	timer.reset();
	preparation.reset();

	$waiting.hide();
	$secondBuyer.hide();
	$operation.hide();
	$questionMark.html("");

	$gamesLeft.html(data.gamesLeft);
	$role.html(data.role);

	const defaultParams = {
		alpha: 0.3,
		beta: 0.6,
		gamma: 0.2,
		t: 10,
		w: 17
	};
	for (let i in defaultParams) {
		let $param = $("." + i);
		$param.html(data[i]);
		if (data[i] != defaultParams[i]) {
			$param.parent().addClass(CLASS.HIGHLIGHT);
		} else {
			$param.parent().removeClass(CLASS.HIGHLIGHT);
		}
	}

	$progressLabel.html("0/" + data.t);
	$progressRow.children().slice(2).detach();
	for (let i = 0; i < data.t; i++) {
		$progressRow.append("<td><div></div></td>");
	}

});

socket.on(EVENT.NEW_PERIOD, (period) => {
	dealer.syncPeriod(period);
	if (period.number == 1) {
		preparation.start();
	} else {
		setTimeout(() => {
			dealer.initPeriod();
		}, 1000);
	}
});

socket.on(EVENT.PROPOSE, dealer.onProposal);

socket.on(EVENT.RESULT, (result) => {
	gPlaying = false;
	socket.emit(EVENT.LEAVE_ROOM);
	for (let i in result) {
		let $cell = $("#" + i);
		$cell.removeClass();
		if (i == "exists2ndBuyer" && result[i]) {
			$cell.html("&#10004");
			$cell.addClass(CLASS.GREEN);
		} else if (i == "exists2ndBuyer" && !result[i]) {
			$cell.html("&#10007");
			$cell.addClass(CLASS.RED);
		} else if (result[i] == null) {
			$cell.html("&#10007");
			$cell.addClass(CLASS.RED);
		} else if (result[i] < 0) {
			$cell.html("-$" + (-result[i].toFixed(2)));
		} else {
			$cell.html("$" + (+result[i].toFixed(2)));
		}
	}
	setTimeout(() => {
		$result.show();
	}, 1000);
});

socket.on(EVENT.SYNC_GAME, (game) => {
	console.log(game);
	socket.emit(EVENT.SYNC_GAME, game);
});

socket.on(EVENT.TEST, (data) => {
	console.log(data);
});

socket.on(EVENT.WAIT, waiting);


socket.on(COMMAND.AUTH_FAILED, (info) => {
	$backdrops.hide();
	$("#auth-failed-info").html(info);
	$("#auth-failed").show();
	$(window).off("beforeunload");
});

socket.on(COMMAND.PAUSE, () => {
	gPaused = true;
	waiting("Paused");
	$loader.addClass("stop");
	timer.stop();
	preparation.stop();
	if (gWaitingOpponent) {
		socket.emit(EVENT.LEAVE_ROOM);	
	}
})

socket.on(COMMAND.RESUME, () => {
	gPaused = false;
	$waiting.hide();
	$loader.removeClass("stop");
	if (gOpponentLost) {
		waiting("Your opponent is lost!")
		setTimeout(() => {
			waiting("Looking for another opponent...");
			socket.emit(EVENT.READY);
			gWaitingOpponent = true;
			gOpponentLost = false;
		}, 2000);
	} else if (gWaitingOpponent) {
		socket.emit(EVENT.READY);
		gOpponentLost = false;
	} else if (gPlaying) {
		timer.start();
	} else if (preparation.preparing) {
		preparation.start();
	}
})


var btnListenr = {}

btnListenr.propose = () => {
	var price = +parseFloat($input.val()).toFixed(2);
	if (isNaN(price) || price < 0) {
		return;
	}
	dealer.propose(price);	
}

btnListenr.accept = () => {
	dealer.decide(true);
}

btnListenr.reject = () => {
	dealer.decide(false);
}


$ready.click((event) => {
	if ($gamesLeft.html() == '0') {
		location.href = "/play/complete";
	} else if (!$(event.currentTarget).hasClass("warmed-up")) {
		$backdrops.hide();
		socket.emit(EVENT.READY);
		gWaitingOpponent = true;
		gOpponentLost = false;
	} else {
		$("#game").hide();
		$("#welcome-page").show();
		$("#welcome").hide();
		$("#good-job").show();
	    $("#welcome-info").hide();
		$("#continue-info").hide();
		$("#good-job-info").show();
		$backdrops.hide();
		$warmup.hide();
		$description.hide();
		$viewDescription.show();
		$continue.show();

		$(event.currentTarget).removeClass("warmed-up");
	}
});

$viewDescription.click(() => {
	$description.slideToggle(500);
});

$input.keypress((event) => {
	var theEvent = event || window.event;
    var key = theEvent.keyCode || theEvent.which;
    if (key === 13 && !gPaused) {
    	$propose.click();
    } else {
    	key = String.fromCharCode(key);
	    var regex = /[0-9]|\./;
	    if(!regex.test(key)) {
	        theEvent.returnValue = false;
	        if (theEvent.preventDefault) {
	        	theEvent.preventDefault();
	        }
	    }
    }  
});

$quit.click(() => {
	location.href = "/logout";
});

$(window).bind('beforeunload', function() {
	if (gPlaying || gWaitingOpponent || preparation.preparing) {
		return 'Are you sure you want to leave?';
	}
});

$description.load("/html/description.html");



});


