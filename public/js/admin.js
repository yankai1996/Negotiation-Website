$(function(){

const COMMAND = {
    ADD: "add",
	AUTH: "cmd auth",
	PAUSE: "cmd pause",
	RESUME: "cmd resume"
}

var $addGamesButton = $("button.add-games")
  , $addPairsInput = $("input.add-pairs")
  , $addPairsButton = $("button.add-pairs")
  , $clearAll = $("#clear-all")
  , $clearParticipants = $("#clear-participants")
  , $deleteContainer = $(".delete-container")
  , $deletePair = $("#delete-pair")
  , $download = $(".download")
  , $floatOnlyInput = $(".float-only")
  , $gameTableBody = $("#game-table-body")
  , $intOnlyInput = $(".int-only")
  , $leftButton = $(".turn-buttons button").eq(0)
  , $pages = $(".pages")
  , $pairCount = $("#count")
  , $pairTableBody = $("#pair-table-body")
  , $parameters = $(".param")
  , $participantTableBody = $("#participant-table-body")
  , $pause = $(".pause")
  , $refresh = $(".refresh")
  , $resetPair = $("#reset-pair")
  , $resume = $(".resume")
  , $rightButton = $(".turn-buttons button").eq(1)
  , $rightPanel = $(".panel.right")
  , $tabButtons = $(".tab-button")
  , $tabContents = $(".tab-content")
  ;

const socket = io.connect();

// open tab
const openTab = (index) => {
	$tabContents.hide();
	$tabContents.eq(index).show()
	$tabButtons.removeClass("active");
	$tabButtons.eq(index).addClass("active");

	$participantTableBody.find("tr").removeClass("focused");
	$rightPanel.hide();
	buttonManager.hideDelete();

	if ($tabContents.eq(index).attr("id") == "Insights") {
		insight.firstDrawChart();
	}
}

const buttonManager = new function() {

	const hiddenWidth = 170;

	// hide all delete buttons
	this.hideDelete = () => {
		$(".delete").animate({width:'hide'}, 300);
		this.hideDeletePair();
	}

	// show delete button of clicked row
	this.toggleDeleteGame = (index) => {
		var $button = $gameTableBody.find(".delete").eq(index);
		if ($button.css("display") == "none") {
			this.hideDelete();
			$button.animate({width:'show'}, 300);
		} else {
			this.hideDelete();
		}
	}

	this.hideDeletePair = () => {
		if ($deleteContainer.width() > hiddenWidth) {
			$deleteContainer.animate({
				width: '-=' + hiddenWidth + 'px',
				height: '-=10px',
				bottom: '+=5px'
			}, 300);
		}	
	}

	this.toggleDeletePair = () => {
		if ($deleteContainer.width() < 40) {
			$deleteContainer.animate({
				width: '+=' + hiddenWidth + 'px',
				height: '+=10px',
				bottom: '-=5px'
			}, 300);
		} else {
			this.hideDeletePair();
		}
	}

}

const gameManager = new function() {

	// click delete button to delete games
	this.deleteMasterGame = (index) => {
		var $row = $gameTableBody.find("tr").eq(index);
		var id = $row.attr('id');

		// post request for deleting games
		$.ajax({
			url:  "/admin/delete_master_game",
			type: "POST",
			data: {id:id},
			success: (res) => {
				if (res.success){
					$row.remove();
					cacheManager.clearAll();
				} else {
					alert(res);
				}
			}
		});
	}

	this.addMasterGame = () => {
		// check if empty input
		$parameters.each(function(){
			var $this = $(this);
			if (!$this.val()) {
				$this.val($this.attr('placeholder'));
			}
		});

		// format the input to numbers
		var params = {
			alpha: parseFloat($('.param#alpha').val()),
			beta : parseFloat($('.param#beta') .val()),
			gamma: parseFloat($('.param#gamma').val()),
			t 	 : parseInt  ($('.param#t')	.val()),
			w	 : parseFloat($('.param#w')	.val())
		};

		// check if invalid number
		for (var i in params) {
			if (i == 'alpha' || i == 'beta' || i == 'gamma') {
				if (params[i] < 0 || params[i] > 1) {
					alert(i + " must be between 0-1!");
					$('#'+i).val('');
					return;
				}
			}
		}

		// post request for adding games
		$.ajax({
			url:  "/admin/add_games",
			type: "POST",
			data: params,
			success: (res) => {
				if (res.success) {
					$parameters.val('');
					updateGames(res.games);
					cacheManager.clearAll();
				} else {
					alert(res);
				}	
			}
		});
	}

	// update game table
	const updateGames = (games) => {
		$gameTableBody.html("");
		games.forEach((g) => {
			var element = 
				"<tr id='" + g.id + "'>" +
					"<td class='alpha'>" + g.alpha + "</td>" +
					"<td class='beta'>"  + g.beta  + "</td>" +
					"<td class='gamma'>" + g.gamma + "</td>" +
					"<td class='t'>" 	 + g.t 	   + "</td>" +
					"<td class='w'>" 	 + g.w 	   + "</td>" +
					"<td class='no-wrap'>" + 
						(g.is_warmup ? "Warm-Up" : "") +
						"<div class='delete'>Delete</div>" + 
					"</td>" +
				"</tr>";
			if (g.is_warmup) {
				$gameTableBody.prepend(element);
			} else {
				$gameTableBody.append(element);
			}
		});
	}

}

const pairManager = new function() {

	const getBuyer = () => {
		return $("tr.focused p").eq(0).text();
	}

	const getSeller = () => {
		return $("tr.focused p").eq(1).text();
	}

	// refresh games in the pair panel
	const refreshpairTable = (games) => {
		$("#buyer").html(games[0].buyer_id);
		$("#seller").html(games[0].seller_id);
		$pairTableBody.html("");
		games.forEach((g) => {
			var element = 
				"<tr id='" + g.id + "'>" +
					"<td>" + g.alpha + "</td>" +
					"<td>" + g.beta + "</td>" +
					"<td>" + g.gamma + "</td>" +
					"<td>" + g.t + "</td>" +
					"<td>" + g.w + "</td>" +
					"<td>" + 
						(g.exists_2nd_buyer ? "Yes" : "No") + 
					"</td>" +
					"<td>" +
						(g.is_warmup ? "Warm-Up" : "") +
					"</td>" +
					"<td>" +
						(g.is_done ? "Done" : "") +
					"</td>" +
				"</tr>";
			if (g.is_warmup) {
				$pairTableBody.prepend(element);
			} else {
				$pairTableBody.append(element);
			}
		});
		$("table.pair tfoot td").html("Total: " + games.length);

		var buyer = getBuyer();
		var seller = getSeller();
		cacheManager.cachePair(buyer, seller, games);
	}

	// click add button to add pairs
	this.addPairs = () => {
		var n = parseInt($addPairsInput.val());
		$addPairsInput.val('');

		// check if invalid input 
		if (!n || n > 100){
			alert("Please enter an number in 1~100!");
			return;
		}

		// post request for adding pairs
		$.ajax({
			url:  "/admin/add_pairs",
			type: "POST",
			data: {n: n},
			success: (res) => {
				if (res.success){
					this.updatePairs(res.pairs, res.count);
					$rightPanel.animate({width: 'hide'}, 500);
					socket.emit(COMMAND.ADD);
					console.log(COMMAND.ADD);
				} else {
					alert(res);
				}
			}
		});
	}

	// show the detail of the selected pair
	this.viewPair = (index) => {
		var $rows = $participantTableBody.find(".button");
		$rows.removeClass("focused");

		$rows.eq(index).addClass("focused");
		$rightPanel.animate({width:'show'}, 500);

		var buyer = getBuyer();
		var seller = getSeller();
		$("#buyer").text(buyer);
		$("#seller").text(seller);

		var games = cacheManager.getCachedPair(buyer, seller);
		if (games != null) {
			refreshpairTable(games);
		} else {
			// post request for viewing a pair
			$.ajax({
				url:  "/admin/view_pair",
				type: "POST",
				data: {id: buyer},
				success: (res) => {
					if (res.success){
						refreshpairTable(res.games);
					} else {
						alert(res);
					}
				}
			});
		}
	}

	this.deletePair = () => {
		var buyer = getBuyer();
		var seller = getSeller();
		$.ajax({
			url:  "/admin/delete_pair",
			type: "POST",
			data: {
				buyer: buyer,
				seller: seller
			},
			success: (res) => {
				if (res.success){
					this.updatePairs(res.pairs, res.count);
					cacheManager.removeCachedPair(buyer, seller);
					$rightPanel.animate({width: 'hide'}, 500);
				} else {
					alert(res);
				}
			}
		});
	}

	// update participant table
	this.updatePairs = (pairs, count) => {
		$pairCount.html(count);
		$participantTableBody.html("");
		pairs.forEach((p) => {
			$participantTableBody.append(
				"<tr class='button'>" +
					"<td>" +
						 "<p>" + p.buyer + "</p>" + 
						 "<p>" + p.seller + "</p>" +
					"</td>" +
					"<td>" +
						"<p> 》 </p>" + 
					"</td>" + 
				"</tr>");
		});
		pageManager.updateCurrentPage();
	}

	this.resetPair = () => {
		var buyer = getBuyer();
		var seller = getSeller();
		$.ajax({
			url:  "/admin/reset_pair",
			type: "POST",
			data: {
				buyer: buyer,
				seller: seller
			},
			success: (res) => {
				if (res.success){
					cacheManager.removeCachedPair(buyer, seller);
					refreshpairTable(res.games);
				} else {
					alert(res);
				}
			}
		});
	}

}


const pageManager = new function(){

	const pageSize = 10;

	this._getCurrentPage = () => {
		return parseInt($pages.text());
	}

	this._getRowCount = () => {
		return $participantTableBody.find("tr").length;
	}

	this._getPageCount = () => {
		return Math.ceil(this._getRowCount() / pageSize);
	}

	this._displayPairs = (start, end) => {
		var $rows = $participantTableBody.find("tr");
		$rows.hide();
		for (var i = start; i < end; i++){
			$rows.eq(i).show();
		}
		$pages.text(Math.ceil((start + 1) / pageSize) + "/" + this._getPageCount());
	}

	this.previousPage = () => {
		var currentPage = this._getCurrentPage();
		if (currentPage > 1){
			var start = (currentPage - 2) * pageSize;
			var end = start + pageSize;
			this._displayPairs(start, end);
		}
	}

	this.nextPage = () => {
		var currentPage = this._getCurrentPage();
		if (currentPage < this._getPageCount()){
			var start = currentPage * pageSize;
			var end = Math.min(start + pageSize, this._getRowCount());
			this._displayPairs(start, end);
		}
	}

	this.updateCurrentPage = () => {
		var start = Math.max(0, this._getCurrentPage() - 1) * pageSize;
		if (start >= this._getRowCount()) {
			start -= pageSize;
		}
		var end = Math.min(start + pageSize, this._getRowCount());
		this._displayPairs(start, end);
	}

	this.clearPages = () => {
		this._displayPairs(0, 0);
	}

	return this._displayPairs(0, pageSize);
}

const cacheManager = new function() {

	// local storage of pair information
	const cache = window.sessionStorage;
	
	this.cachePair = (buyer, seller, games) => {
		cache.setItem(buyer + seller, JSON.stringify(games));
	}

	this.getCachedPair = (buyer, seller) => {
		return JSON.parse(cache.getItem(buyer + seller));
	}

	this.removeCachedPair = (buyer, seller) => {
		cache.removeItem(buyer + seller);
	}

	this.clearAll = () => {
		cache.clear();
	}

	return this.clearAll();
}

const insight = new function() {

	const histogram = (profits, step) => {
	    var histo = {}
	      , arr = []
	      , minGroup = 0
	      , maxGroup = 0
	      ;

	    // Group down
	    for (let i = 0; i < profits.length; i++) {
	        let x = Math.floor(profits[i] / step) * step;
	        minGroup = Math.min(minGroup, x);
	        maxGroup = Math.max(maxGroup, x);
	        if (!histo[x]) {
	            histo[x] = 0;
	        }
	        histo[x]++;
	    }

	    // Make the histo group into an array
	    for (let x = minGroup; x <= maxGroup; x += step) {
	    	let n = histo[x] || 0;
	    	arr.push([parseFloat(x), n]);
	    }

	    // Finally, sort the array
	    return arr.sort();
	}

	const drawChart = (buyerData, sellerData) => {
		Highcharts.chart('all-chart', {
		    chart: {
		        type: 'column',
		        style: {
		        	fontFamily: 'Roboto',
		        	fontSize: '16px'
		        }
		    },
		    title: {
		        text: "Distribution of Profit" 
		    },
		    xAxis: {
		        gridLineWidth: 1
		    },
		    yAxis: {
		        title: {
		            text: 'Number'
		        }
		    },
		    plotOptions: {
		        column: {
		            stacking: 'normal'
		        }
		    },
		    series: [{
		        name: 'Buyer',
		        type: 'column',
		        data: histogram(buyerData, 10),
		        color: 'rgb(138, 199, 255)',
		        pointPadding: 0,
		        groupPadding: 0,
		        pointPlacement: 'between'
		    }, {
		    	name: 'Seller',
		        type: 'column',
		        data: histogram(sellerData, 10),
		        color: 'rgb(245, 163, 99)',
		        pointPadding: 0,
		        groupPadding: 0,
		        pointPlacement: 'between'
		    }]
		});
	}

	this.refreshChart = () => {
		$.ajax({
			url:  "/admin/insights",
			type: "POST",
			data: {},
			success: (res) => {
				if (res.success){
					drawChart(res.buyerProfit, res.sellerProfit);
				} else {
					alert(res);
				}
			}
		});
	}

	this.firstDrawChart = () => {
		this.refreshChart();
		this.firstDrawChart = () => {};
	}
}

const setting = new function() {

	const clearData = (scope) => {
		$.ajax({
			url:  "/admin/clear",
			type: "POST",
			data: {scope: scope},
			success: (res) => {
				if (res.success){
					pairManager.updatePairs(res.pairs, res.count);
					pageManager.clearPages();
					cacheManager.clearAll();
					if (scope == "all") {
						$gameTableBody.html("");
					}
				} else {
					alert(res);
				}
			}
		});
	}

	this.clearParticipants = () => {
		var info = "Do you want to clear all participants? " + 
			"The experiment data will also be deleted.";
		if (confirm(info)){
			clearData("participants");
		}
	}

	this.clearAll = () => {
		var info = "Do you want to clear all the data?"
		if (confirm(info)){
			clearData("all");
		}
	}

	this.resume = () => {
		$resume.addClass("on");
		$resume.off("click");
		$pause.removeClass("paused");
		$pause.click(this.pause);
		socket.emit(COMMAND.RESUME);
	}

	this.pause = () => {
		$pause.addClass("paused");
		$pause.off("click");
		$resume.removeClass("on");
		$resume.click(this.resume);
		socket.emit(COMMAND.PAUSE);
	}

}

socket.on(COMMAND.AUTH, (data, respond) => {
	console.log(data);
	respond();
});

$tabButtons.click((event) => {
	var index = $tabButtons.index(event.currentTarget);
	openTab(index);
});

$gameTableBody.on("click", "tr", (event) => {
	var index = $gameTableBody.find("tr").index(event.currentTarget);
	buttonManager.toggleDeleteGame(index);
});

$gameTableBody.on("click", ".delete", (event) => {
	var index = $gameTableBody.find(".delete").index(event.currentTarget);
	gameManager.deleteMasterGame(index);
});

$floatOnlyInput.keypress((event) => {
	var theEvent = event || window.event;
    var key = theEvent.keyCode || theEvent.which;
    key = String.fromCharCode(key);
    var regex = /[0-9]|\./;
    if (!regex.test(key)) {
        theEvent.returnValue = false;
        if (theEvent.preventDefault) theEvent.preventDefault();
    }
});

$intOnlyInput.keypress((event) => {
	var theEvent = event || window.event;
    var key = theEvent.keyCode || theEvent.which;
    key = String.fromCharCode(key);
    var regex = /[0-9]/;
    if (!regex.test(key)) {
        theEvent.returnValue = false;
        if (theEvent.preventDefault) theEvent.preventDefault();
    }
})

$addGamesButton.click(gameManager.addMasterGame);

$addPairsButton.click(pairManager.addPairs);

$participantTableBody.on('click', '.button', (event) => {
	var index = $participantTableBody.find('.button').index(event.currentTarget);
	buttonManager.hideDelete();
	pairManager.viewPair(index);
})

$leftButton.click(pageManager.previousPage);

$rightButton.click(pageManager.nextPage);

$deleteContainer.click(buttonManager.toggleDeletePair);

$deletePair.click(pairManager.deletePair);

$resetPair.click(pairManager.resetPair);

$refresh.click(insight.refreshChart);

const animateDownload = () => {

	$download.off("click");
	$download.addClass("nohover");
	
	var $p = $download.find("p");
	var $label = $download.find("label");
	var $loader = $download.find("#loader");
	var $backCircle = $download.find("#back-circle");

	var animations = [];

	const runAnimations = (animations) => {
		if (!animations.length) {
			return;
		}
		var duration = animations[0]();
		setTimeout(() => {
			runAnimations(animations.slice(1));
		}, duration);
	}

	animations.push(() => {
		$p.fadeOut(100);
		$download.animate({
			width: 46,
			borderColor: "#ddd"
		}, 300);
		return 500;
	});

	animations.push(() => {
		$loader.show();
		$loader.circleProgress({
		    value: 1,
		    size: 48,
		    startAngle: -Math.PI / 2,
		    thickness: 1,
		    fill: {gradient: ["red", "orange"]}
		});
		return 1300;
	});

	animations.push(() => {
		$label.fadeIn(300);
		$loader.hide();
		$backCircle.show();
		$backCircle.animate({
			backgroundColor: "#8c8"
		}, 300).delay(500).animate({
			backgroundColor: "transparent"
		}, 300);
		return 1100
	});

	animations.push(() => {
		$download.css("borderColor", "#159287");
		$backCircle.hide();
		$label.hide();
		$download.animate({
			width: 182,
		}, 300);
		$download.append("<a href='/admin/download' download></a>");
		$download.find("a")[0].click();
		$download.find("a").remove();
		return 300
	});

	animations.push(() => {
		$p.fadeIn(100);
		$download.removeClass("nohover");
		$download.click(animateDownload);
		return 100;
	});

	runAnimations(animations);
}

$download.click(animateDownload);

$clearParticipants.click(setting.clearParticipants);

$clearAll.click(setting.clearAll);


if ($resume.is(".on")) {
	$pause.click(setting.pause);
} else {
	$resume.click(setting.resume);
}



});

