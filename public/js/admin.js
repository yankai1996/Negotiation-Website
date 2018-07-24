$(function(){


var $addGamesButton = $("button.add-games")
  , $addPairsInput = $("input.add-pairs")
  , $addPairsButton = $("button.add-pairs")
  , $deleteContainer = $(".delete-container")
  , $deletePair = $("#delete-pair")
  , $floatOnlyInput = $(".float-only")
  , $gameTableBody = $("#game-table-body")
  , $insightTableBody = $("#insight-table-body")
  , $intOnlyInput = $(".int-only")
  , $leftButton = $(".turn-buttons button").eq(0)
  , $logout = $(".logout")
  , $pages = $(".pages")
  , $pairCount = $("#count")
  , $parameters = $(".param")
  , $participantTableBody = $("#participant-table-body")
  , $rightButton = $(".turn-buttons button").eq(1)
  , $rightPanel = $(".panel.right")
  , $tabButtons = $(".tab-button")
  , $tabContents = $(".tab-content")
  ;

// open tab
const openTab = (index) => {
	$tabContents.hide();
	$tabContents.eq(index).show()
	$tabButtons.removeClass("active");
	$tabButtons.eq(index).addClass("active");

	$participantTableBody.find("tr").removeClass("focused");
	$rightPanel.hide();
	buttonManager.hideDelete();
}

const buttonManager = new function(){

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
		if ($deleteContainer.width() > 85) {
			$deleteContainer.animate({
				width: '-=85px',
				height: '-=10px',
				bottom: '+=5px'
			}, 100);
		}	
	}

	this.toggleDeletePair = () => {
		if ($deleteContainer.width() < 40) {
			$deleteContainer.animate({
				width: '+=85px',
				height: '+=10px',
				bottom: '-=5px'
			}, 100);
		} else {
			this.hideDeletePair();
		}
	}

}

// click delete button to delete games
const deleteMasterGame = (index) => {
	var id = $gameTableBody.find("tr").eq(index).attr('id');

	// post request for deleting games
	$.ajax({
		url:  "/admin/delete_master_game",
		type: "POST",
		data: {id:id},
		success: (res) => {
			if (res.success){
				$gameTableBody.find("tr").eq(index).remove();
				cacheManager.clearAll();
			} else {
				alert(res);
			}
		}
	});

}


// click ADD button to add games
const addMasterGame = () => {
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

// click add button to add pairs
const addPairs = () => {
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
				updatePairs(res.pairs, res.count);
				$rightPanel.animate({width: 'hide'}, 500);
			} else {
				alert(res);
			}
		}
	});
}

// update participant table
const updatePairs = (pairs, count) => {
	$pairCount.html(count);
	$participantTableBody.html("");
	pairs.forEach((p) => {
		$participantTableBody.append(
			"<tr" + (p.second ? " class='button'>" : ">") +
				"<td>" +
					 "<p>" + p.first + "</p>" + 
					 "<p>" + p.second + "</p>" +
				"</td>" +
				"<td><p> 》 </p>" + 
					"<div class='delete'>Delete</div>" + 
				"</td>" + 
			"</tr>");
	});
	pageManager.updateCurrentPage();
}

const getFirst = () => {
	return $("tr.focused p").eq(0).text();
}

const getSecond = () => {
	return $("tr.focused p").eq(1).text();
}


// show the detail of the selected pair
const viewPair = (index) => {
	var $rows = $participantTableBody.find(".button");
	$rows.removeClass("focused");

	$rows.eq(index).addClass("focused");
	$rightPanel.animate({width:'show'}, 500);

	var first = getFirst();
	var second = getSecond();
	showPair(first, second);
	
}

const showPair = (first, second) => {
	$("#first").text(first);
	$("#second").text(second);

	var games = cacheManager.getCachedPair(first, second);
	if (games != null) {
		refreshInsightTable(games);
	} else {
		// post request for viewing a pair
		$.ajax({
			url:  "/admin/view_pair",
			type: "POST",
			data: {id: first},
			success: (res) => {
				if (res.success){
					refreshInsightTable(res.games);
				} else {
					alert(res);
				}
			}
		});
	}
}

const pageManager = new function(){

	this._pageSize = 10;

	this._getCurrentPage = () => {
		return parseInt($pages.text());
	}

	this._getPageCount = () => {
		return Math.ceil($participantTableBody.find("tr").length / this._pageSize);
	}

	this._displayPairs = (start, end) => {
		var $rows = $participantTableBody.find("tr");
		$rows.hide();
		for (var i = start; i < end; i++){
			$rows.eq(i).show();
		}
		var pageCount = Math.ceil($rows.length / this._pageSize);
		$pages.text(Math.ceil((start + 1) / this._pageSize) + "/" + pageCount);
	}

	this.previousPage = () => {
		var currentPage = this._getCurrentPage();
		if (currentPage > 1){
			var start = (currentPage - 2) * this._pageSize,
				end = start + this._pageSize;
			this._displayPairs(start, end);
		}
	}

	this.nextPage = () => {
		var pageCount = this._getPageCount(),
			currentPage = this._getCurrentPage();
		if (currentPage < pageCount){
			var start = currentPage * this._pageSize,
				end = Math.min(start + this._pageSize, $participantTableBody.find("tr").length);
			this._displayPairs(start, end);
		}
	}

	this.updateCurrentPage = () => {
		var start = (this._getCurrentPage() - 1) * this._pageSize;
			end = Math.min(start + this._pageSize, $participantTableBody.find("tr").length);
		this._displayPairs(start, end);
	}

	return this._displayPairs(0, this._pageSize);

}

const cacheManager = new function(){

	// local storage of pair information
	this.cachePair = (first, second, games) => {
		window.sessionStorage.setItem(first + second, JSON.stringify(games));
	}

	this.getCachedPair = (first, second) => {
		return JSON.parse(window.sessionStorage.getItem(first + second));
	}

	this.removeCachedPair = (first, second) => {
		window.sessionStorage.removeItem(first + second);
	}

	this.clearAll = () => {
		window.sessionStorage.clear();
	}

}

// refresh games in the pair panel
const refreshInsightTable = (games) => {
	$("#buyer").html(games[0].buyer_id);
	$("#seller").html(games[0].seller_id);
	$insightTableBody.html("");
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
			$insightTableBody.prepend(element);
		} else {
			$insightTableBody.append(element);
		}
	});
	$("table.insight tfoot td").html("Total: " + games.length);

	var first = getFirst();
	var second = getSecond();
	cacheManager.cachePair(first, second, games);
}

const deletePair = (first, second) => {
	$.ajax({
		url:  "/admin/delete_pair",
		type: "POST",
		data: {
			first: first,
			second: second
		},
		success: (res) => {
			if (res.success){
				updatePairs(res.pairs, res.count);
				cacheManager.removeCachedPair(first, second);
				$rightPanel.animate({width: 'hide'}, 500);
			} else {
				alert(res);
			}
		}
	});
}



$logout.click(() => {
	location.href = "/logout";
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
	deleteMasterGame(index);
});

$floatOnlyInput.keypress((event) => {
	var theEvent = event || window.event;
    var key = theEvent.keyCode || theEvent.which;
    key = String.fromCharCode( key );
    var regex = /[0-9]|\./;
    if( !regex.test(key) ) {
        theEvent.returnValue = false;
        if(theEvent.preventDefault) theEvent.preventDefault();
    }
});

$intOnlyInput.keypress((event) => {
	var theEvent = event || window.event;
    var key = theEvent.keyCode || theEvent.which;
    key = String.fromCharCode( key );
    var regex = /[0-9]/;
    if( !regex.test(key) ) {
        theEvent.returnValue = false;
        if(theEvent.preventDefault) theEvent.preventDefault();
    }
})

$addGamesButton.click(() => {
	addMasterGame();
})

$addPairsButton.click(() => {
	addPairs()
});

$participantTableBody.on('click', '.button', (event) => {
	var index = $participantTableBody.find('.button').index(event.currentTarget);
	buttonManager.hideDelete();
	viewPair(index);
})

$leftButton.click(() => {
	pageManager.previousPage();
});

$rightButton.click(() => {
	pageManager.nextPage();
});

$deleteContainer.click(() => {
	buttonManager.toggleDeletePair();
});

$deletePair.click(() => {
	var first = getFirst();
	var second = getSecond();
	deletePair(first, second);
})


// show the Games tab
$("#Games").show();

});

