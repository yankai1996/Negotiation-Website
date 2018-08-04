$(function(){

const ID = $("#participant-id").text();
const EVENT = {
    COMPLETE: 'complete',
    DECISION: 'decision',
    END_PERIOD: 'end period',
    LEAVE_ROOM: 'leave room',
    LOGIN: 'login',
    LOST_OP: 'lost opponent',
    NEW_GAME: 'new game',
    NEW_PERIOD: 'new period',
    PROPOSE: 'propose',
    READY: 'ready',
    RESULT: 'result',
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
	DONE: 'done',
	HIGHLIGHT: 'highlight',
	NONE: 'refused',
	PROPOSAL: 'proposal',
	RED: 'red',
	REFUSED: 'refused',
	SECOND: 'second',
	WAIT: 'wait',
}

var gPeriod = {};

var $accept = $("button#accept")
  , $backdrops = $(".backdrop")
  , $boxes = $(".box")
  , $completePage = $("#complete-page")
  , $continue = $("#continue")
  , $description = $("#description")
  , $input = $(".input-box input")
  , $game = $("#game")
  , $gamesLeft = $("#games-left")
  , $operation = $(".operation")
  , $operationButtons = $(".button-box button")
  , $preparation = $("#preparation")
  , $preparationTime = $(".preparation-time")
  , $progressRow = $("#progress-row")
  , $progressLabel = $("#progress-label")
  , $proposal = $(".proposal")
  , $propose = $("button#propose")
  , $quit = $("#quit")
  , $ready = $(".ready")
  , $refuse = $("button#refuse")
  , $result = $("#result")
  , $secondBuyer = $("#2nd-buyer")
  , $timer = $(".timer#timer1")
  , $viewDescription = $("#view-description")
  , $waiting = $("#waiting")
  , $waitingInfo = $("#waiting-info")
  ,	$warmup = $("#warm-up")
  ;


function Timer($timer) {
	this.time = 60;
	this.count = this.time;
	this.$timer = $timer;
	this.$clock = $timer.find(".clock");
	this.$timeBar = $timer.find("td .time-bar");	
}

Timer.prototype.start = function () {
	this.$timeBar.animate({width: '0%'}, this.count * 1000);
	this.interval = setInterval(() => {
		this.count--;
		this.$clock.html(('0' + this.count).slice(-2)); 
		if (this.count == 10) {
			this.$timer.addClass(CLASS.RED);
		}
		if ($proposal.hasClass(CLASS.WAIT)) {
			$proposal.animate({
				backgroundColor: this.count % 2 ? '#fafafa' : '#eee'
			}, 1000);
		}
		if (this.count == 0) {
			this.stop();
			endPeriod();
		}
	}, 1000);
}

Timer.prototype.stop = function () {
	clearInterval(this.interval);
	this.$timeBar.stop();
}

Timer.prototype.reset = function () {
	this.stop();
	this.count = this.time;
	this.$clock.html(this.time);
	this.$timer.removeClass(CLASS.RED);
	this.$timeBar.css('width', '100%');
}

Timer.prototype.lap = function () {
	return this.time - this.count;
}

var timer = new Timer($timer);

var socket = io.connect();


const askDecision = () => {
	showProposal("$" + gPeriod.price);
	$operationButtons.removeClass(CLASS.DISABLE);
	$proposal.stop();
	$proposal.css('backgroundColor', '#eee');
}

const askProposal = () => {
	$input.show();
	$input.val('');
	$propose.show();
	$propose.removeClass(CLASS.DISABLE);
}

const decide = (accepted) => {
	gPeriod.accepted = accepted;
	gPeriod.decided_at = timer.lap();
	endPeriod();

	timer.stop();
	$operationButtons.addClass(CLASS.DISABLE);
}

const disableProposal = () => {
	$propose.addClass(CLASS.DISABLE);
	$timer.stop();
	showProposal("Your proposal: $" + gPeriod.price);
}

const endPeriod = () => {
	if (isMyTurn()) {
		socket.emit(EVENT.END_PERIOD, gPeriod);
	}
}

const getReady = () => {
	waiting();
	setTimeout(() => {
		socket.emit(EVENT.READY);
	}, 5000);
}

const initPeriod = () => {
	var $grids = $progressRow.find('div');
	var $current = $grids.eq(gPeriod.number - 1);
	$current.addClass(CLASS.DONE);
	var $gridsDone = $progressRow.find('div.done');
	if ($grids.length - $gridsDone.length < 2) {
		$gridsDone.css('backgroundColor', '#f55');
	} else if ($gridsDone.length / $grids.length > 0.5) {
		$gridsDone.css('backgroundColor', '#fa0');
	}

	var t = $progressLabel.html().split('/')[1];
	$progressLabel.html(gPeriod.number + "/" + t);

	$operation.show();
	$input.hide();
	$proposal.hide();
	$operationButtons.hide();
	$timer.show();
	timer.reset();
}

const isMyTurn = () => {
	if (gPeriod.proposer_id == ID && gPeriod.price == null) {
		return true;
	}
	if (gPeriod.proposer_id != ID && gPeriod.price != null) {
		return true;
	}
	return false;
}

const prepare = (time) => {
	var count = time;
	$preparationTime.html(count);
	$preparation.fadeIn(1000);
	var interval = setInterval(() => {
		count--;
		if (count > 0) {
			$preparationTime.html(count);
		} else {
			$preparationTime.html("Start!");
			clearInterval(interval);
			$preparation.fadeOut(1000);
		}
	}, 1000);
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

const waiting = (info) => {
	info = info || "Looking for your opponent...";
	$waitingInfo.html(info);
	$backdrops.hide();
	$waiting.show();
}

const waitProposal = () => {
	showProposal('WAIT');
	$accept.show();
	$refuse.show();
	$operationButtons.addClass(CLASS.DISABLE);
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
socket.on(EVENT.DECISION, (period) => {
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

socket.on(EVENT.LOGIN, (data, respond) => {
	respond(ID);
})

socket.on(EVENT.LOST_OP, (info) => {
	waiting(info);
	timer.stop();
});

socket.on(EVENT.NEW_GAME, (data) => {
	$boxes.hide();
	$waiting.hide();
	$game.show();
	$secondBuyer.hide();
	$operation.hide();
	timer.reset();

	const defaultParams = {
		alpha: 0.3,
		beta: 0.6,
		gamma: 0.2,
		t: 10,
		w: 17
	};
	for (let i in data) {
		let $param = $("." + i);
		$param.html(data[i]);
		if (defaultParams[i] && data[i] != defaultParams[i]) {
			$param.parent().addClass(CLASS.HIGHLIGHT);
		} else {
			$param.parent().removeClass(CLASS.HIGHLIGHT);
		}
	}
	$gamesLeft.html(data.gamesLeft);
	$progressLabel.html("0/" + data.t);
	$progressRow.children().slice(2).detach();
	for (let i = 0; i < data.t; i++) {
		$progressRow.append("<td><div></div></td>");
	}
	prepare(data.preparationSeconds);
});

socket.on(EVENT.NEW_PERIOD, (period) => {
	gPeriod = period;

	$preparation.fadeOut(1000);
	setTimeout(() => {
		initPeriod();
		if (period.show_up_2nd_buyer) {
			endPeriod();
		} else if (period.proposer_id == ID) {
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
	if (isMyTurn()) {
		askDecision();
	}
	timer.reset();
	timer.start();
});

socket.on(EVENT.RESULT, (result) => {
	for (let i in result) {
		if (i == 'exists2ndBuyer') {
			$("#exists2ndBuyer").html(result[i]);
		} else if (result[i] < 0) {
			$("#" + i).html("-$" + (-result[i]));
		} else {
			$("#" + i).html("$" + result[i]);
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


$ready.click(() => {
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
	var price = parseFloat($input.val()).toFixed(2);
	if (isNaN(price) || price < 0) {
		return;
	}
	gPeriod.price = price;
	gPeriod.proposed_at = timer.lap();
	disableProposal();
	socket.emit(EVENT.PROPOSE, gPeriod);	
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


$description.load("/html/description.html");

});


