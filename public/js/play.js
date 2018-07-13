
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
    SYNC_PERIOD: 'sync period',
    TEST: 'test',
    WAIT: 'wait opponent',
};


var $accept = $("#accept")
  , $boxes = $(".box")
  , $buttonBox = $(".button-box")
  , $complete = $("#complete")
  , $decision = $("#decision")
  , $input = $("#proposal input")
  , $game = $("#game")
  , $operations = $(".operation")
  , $params = $(".params")
  , $progressRow = $("#progress-row")
  , $progressLabel = $("#progress-label")
  , $proposal = $("#proposal")
  , $propose = $("#propose")
  , $proposed = $(".proposed")
  , $refuse = $("#refuse")
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

const timer = new function(time=30) {
	this.time = time;
	this.count = time;
	this.$timer = $(".timer");
	this.$time = $("#time");
	this.$waitProposal = $("#wait-proposal");
	this.$remainingTime = $(".remaining-time");

	this.start = () => {
		this.$remainingTime.animate({width: '0%'}, this.time*1000);
		this.set = setInterval(() => {
	        this.count--;
	        this.$time.html(('0' + this.count).slice(-2)); 
	        if (this.count == 10) {
	        	this.$timer.addClass('red');
	        }
	        if (this.count % 2 == 1) {
	        	this.$waitProposal.animate({backgroundColor: '#fafafa'}, 1000);
	        } else {
	        	this.$waitProposal.animate({backgroundColor: '#eee'}, 1000);
	        }
	        if (this.count === 0) {
	            this.reset();
	            socket.emit(EVENT.END_PERIOD, {
	            	decided_at: null
	            });
	        }
	    }, 1000);

	}
	this.reset = () => {
		clearInterval(this.set);
		this.count = this.time;
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

socket.on(EVENT.NEW_PERIOD, (period) => {
	socket.emit(EVENT.SYNC_PERIOD, period);
	$progressRow.find('div').eq(period.number - 1).addClass('done')
	// if (period.show_up_2nd_buyer) {
	// 	$secondBuyer.show()
	// }
	if (period.proposer == ID) {
		proposal();
	} else {
		waitProposal();
	}

	timer.restart();
});

socket.on(EVENT.PROPOSE, (price) => {
	$waitProposal.hide();
	$proposed.html("$" + price);
	$proposed.show();
	$buttonBox.find('button').removeClass('disable');
})

socket.on(EVENT.START, (data) => {
	$boxes.hide();
	$waiting.hide();
	$secondBuyer.hide();
	$game.show();

	for (let i in data) {
		$params.find("#" + i).html(data[i]);
	}

	$progressLabel.html("1/" + data.t)
	$progressRow.children().slice(2).detach();
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

$input.keypress((event) => {
	var theEvent = event || window.event;
    var key = theEvent.keyCode || theEvent.which;
    key = String.fromCharCode( key );
    var regex = /[0-9]|\./;
    if( !regex.test(key) ) {
        theEvent.returnValue = false;
        if(theEvent.preventDefault) theEvent.preventDefault();
    }
});

$propose.click(() => {
	if ($propose.hasClass('disable')) {
		return;
	}
	var price = parseFloat($input.val());
	socket.emit(EVENT.PROPOSE, {
		price: price,
		proposed_at: timer.time - timer.count
	});
	$propose.addClass('disable');
	$input.hide();
	$proposed.html("Your proposal: $" + price);
	$proposed.show();
});

const endPeriod = (accepted) => {
	socket.emit(EVENT.END_PERIOD, {
		accepted: accepted,
		decided_at: timer.time - timer.count
	});
	$buttonBox.find('button').addClass('disable');
}

$accept.click(() => {
	if ($accept.hasClass('disable')) {
		return;
	}
	endPeriod(true)
});

$refuse.click(() => {
	if ($refuse.hasClass('disable')) {
		return;
	}
	endPeriod(false);
});

// $(".round").click(() => {
// 	$waiting.hide();
// });
