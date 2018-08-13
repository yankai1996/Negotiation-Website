$(function(){

const ID = $("#participant-id").text();
const COMMAND = {
	AUTH: "auth",
	PAUSE: "pause",
	RESUME: "resume"
}
const EVENT = {
    COMPLETE: 'complete',
    DECISION: 'decision',
    END_PERIOD: 'end period',
    LEAVE_ROOM: 'leave room',
    LOST_OP: 'lost opponent',
    NEW_GAME: 'new game',
    NEW_PERIOD: 'new period',
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
	REFUSED: "Proposal Refused!",
	SECOND: "2nd Buyer Offered!",
	WAIT: 'Waiting for proposal...'
}
const CLASS = {
	ACCEPTED: 'accepted',
	DISABLE: 'disable',
	DONE: 'done',
	GREEN: 'green',
	HIGHLIGHT: 'highlight',
	NONE: 'refused',
	PROPOSAL: 'proposal',
	RED: 'red',
	REFUSED: 'refused',
	SECOND: 'second',
	WAIT: 'wait',
}

var gWarmup = false;
var gPlaying = false;
var gPaused;

var $accept = $("button#accept")
  , $backdrops = $(".backdrop")
  , $boxes = $(".box")
  , $completePage = $("#complete-page")
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
  , $refuse = $("button#refuse")
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

const timer = new function() {

	const time = 60;
	var count = time;

	this.start = function () {
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
		clearInterval(this.interval);
		$timeBar.stop();
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

const preparation = new function() {

	const time = 10;
	var count = time;

	this.preparing = false;

	this.start = function () {
		this.preparing = true;
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
				this.stop();				
				this.preparing = false;
				count = time;
				dealer.initPeriod();
			}
		}, 1000);
	}

	this.stop = function () {
		clearInterval(this.interval)
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
		$proposal.show();
	}

	this.syncPeriod = (period) => {
		this.period = period;
	}

	this.initPeriod = () => {

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
			$refuse.show();
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
			enableButton($refuse, btnListenr.refuse);
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
		if (this.period.show_up_2nd_buyer) {
			showProposal('SECOND');
			$secondBuyer.show();
		} else if (this.period.accepted) {
			showProposal('ACCEPTED');
		} else if (this.period.decided_at) {
			showProposal('REFUSED');
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




const complete = () => {
	const checkCell = (param) => {
		if (param === null || param === false) {
			return "<td class='red'>&#10007;</td>";
		} else if (param === true) {
			return "<td class='green'>&#10004;</td>";
		}
		return "<td>" + param + "</td>";
	}

	$.ajax({
		url:  "/play/complete",
		type: "POST",
		data: {id: ID},
		success: (res) => {
			if (res.success){
				var summary = res.summary;
				var totalProfit = 0; 
				summary.forEach((s) => {
					totalProfit += s.selfProfit
					$("#summary-table-body").append(
						"<tr>" + 
							"<td>" + (summary.indexOf(s) + 1) + "</td>" +
							checkCell(s.price) +
							"<td>" + s.cost + "</td>" +
							checkCell(s.exists2ndBuyer) +
							"<td>" + s.opponentProfit + "</td>" +
							"<td>" + s.selfProfit + "</td>" +
						"</tr>");
				});
				totalProfit = +totalProfit.toFixed(2);
				$("#total-profit").html("$" + totalProfit);
				$("#final-payoff").html("$" + (totalProfit + 40));
			} else {
				alert(res);
			}
		}
	});

	socket.disconnect();
	$boxes.hide();
	$backdrops.hide();
	$completePage.show();
}

const waiting = (info) => {
	info = info || "Looking for your opponent...";
	$waitingInfo.html(info)
	$waiting.show();
}



var sktListener = {};

sktListener.complete = () => {
	complete();
}

sktListener.decision = (period) => {
	dealer.onDecision(period);
}

sktListener.opponentLost = (info) => {
	waiting(info);
	timer.stop();
}

sktListener.newGame = (data) => {

	timer.reset();

	gWarmup = data.isWarmup;

	$wait.hide();
	$secondBuyer.hide();
	$operation.hide();

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

}

sktListener.newPeriod = (period) => {
	dealer.syncPeriod(period);
	if (period.number == 1) {
		preparation.start();
	} else {
		gPlaying = true;
		setTimeout(() => {
			dealer.initPeriod();
		}, 1000);
	}
}

sktListener.propose = (period) => {
	dealer.onProposal(period);
}

sktListener.result = (result) => {
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
}

sktListener.syncGame = (game) => {
	console.log(game);
	socket.emit(EVENT.SYNC_GAME, game);
}

sktListener.test = (data) => {
	console.log(data);
}

sktListener.wait = (info) => {
	waiting(info);
}

const bindSktListener = () => {
	socket.on(EVENT.COMPLETE, sktListener.complete);
	socket.on(EVENT.DECISION, sktListener.decision);
	socket.on(EVENT.LOST_OP, sktListener.opponentLost);
	socket.on(EVENT.NEW_GAME, sktListener.newGame);
	socket.on(EVENT.NEW_PERIOD, sktListener.newPeriod);
	socket.on(EVENT.PROPOSE, sktListener.propose);
	socket.on(EVENT.RESULT, sktListener.result);
	socket.on(EVENT.SYNC_GAME, sktListener.syncGame);
	socket.on(EVENT.TEST, sktListener.test);
	socket.on(EVENT.WAIT, sktListener.wait);
}

socket.on(COMMAND.PAUSE, () => {
	gPaused = true;
	waiting("Paused");
	$loader.addClass("stop");
	timer.stop();
	preparation.stop();
	if ($ready.is(":visible")) {
		socket.emit(EVENT.LEAVE_ROOM);	
	}
	unbindSktListener();
})

socket.on(COMMAND.RESUME, () => {
	gPaused = false;
	$waiting.hide();
	$loader.removeClass("stop");
	if (gPlaying) {
		timer.start();
	} else if (preparation.preparing) {
		preparation.start();
	}
	bindSktListener();
})

const unbindSktListener = () => {
	for (let i in EVENT) {
		socket.off(EVENT[i]);
	}
}

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

btnListenr.refuse = () => {
	dealer.decide(false);
}


$ready.click(() => {
	if ($gamesLeft.html() == '0') {
		complete();
	} else if (!gWarmup) {
		$backdrops.hide();
		socket.emit(EVENT.READY);
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

		gWarmup = false;
	}
});

$viewDescription.click(() => {
	$description.slideToggle(500);
});

$input.keypress((event) => {
	var theEvent = event || window.event;
    var key = theEvent.keyCode || theEvent.which;
    if (key === 13) {
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


const main = () => {
	$description.load("/html/description.html");
	if ($completePage.is(':visible')) {
		complete();
	} else {
		bindSktListener();
	}
}
main();


});


