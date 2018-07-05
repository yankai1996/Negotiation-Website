$(function(){

const PAGE_SIZE = 10;

var $logout = $(".logout")
  , $tabButtons = $(".tab-button")
  , $tabContents = $(".tab-content")
  , $gameTableBody = $("#game-table-body")
  , $parameters = $(".param")
  , $floatOnlyInput = $(".float-only")
  , $intOnlyInput = $(".int-only")
  , $addGamesButton = $("button.add-games")
  , $addParticipantsInput = $("input.add-participants")
  , $addParticipantsButton = $("button.add-participants")
  , $participantTableBody = $("#participant-table-body")
  , $rightPanel = $(".panel.right")
  , $leftButton = $(".turn-buttons button").eq(0)
  , $rightButton = $(".turn-buttons button").eq(1)
  , $pages = $(".pages")
  , $pairTableBody = $("#pair-table-body")
  , $assignTableBody = $("#assignment-table-body")
  , $assignGamesButton = $("button.assign-games")
  ;

// open tab
const openTab = (index) => {
	$tabContents.hide();
	$tabContents.eq(index).show()
	$tabButtons.removeClass("active");
	$tabButtons.eq(index).addClass("active");

	$participantTableBody.find("tr").removeClass("focused");
	$rightPanel.hide();
	hideDelete();
}

// hide all delete buttons
const hideDelete = () => {
	$(".delete").animate({width:'hide'}, 300);
	$(".moved").animate({marginLeft: "+=55px"}, 300);
	$(".moved").removeClass("moved");
}

// show delete button of clicked row
const showDelete = (index) => {
	var $button = $gameTableBody.find(".delete").eq(index);
	if ($button.css("display") == "none") {
		hideDelete();
		$button.animate({width:'show'}, 300);
	} else {
		hideDelete();
	}
}

// click delete button to delete games
const deleteGames = (index) => {
	var data = {
		alpha: parseFloat($('.alpha').eq(index).text()),
		beta : parseFloat($('.beta') .eq(index).text()),
		gamma: parseFloat($('.gamma').eq(index).text()),
		t 	 : parseInt  ($('.t')	 .eq(index).text()),
		w	 : parseFloat($('.w')	 .eq(index).text()),
		n  	 : parseInt  ($('.n')	 .eq(index).text())
	};

	// post request for deleting games
	$.ajax({
		url:  "/admin/delete_games",
		type: "POST",
		data: data,
		success: (res) => {
			if (res.success){
				$gameTableBody.find("tr").eq(index).remove();
			} else {
				alert(res);
			}
		}
	});

	window.sessionStorage.clear();
}


// click ADD button to add games
const addGames = () => {
	// check if empty input
	var isEmpty = false;
	$parameters.each(function(){
		var $this = $(this);
		if (!$this.val()) {
			if ($this.attr('id') == 'n') {
				isEmpty = true;
			} else {
				$this.val($this.attr('placeholder'))
			}
		}
	});
	if (isEmpty) {
		alert("Please enter n!");
		return;
	}

	// format the input to numbers
	var data = {
		alpha: parseFloat($('.param#alpha').val()),
		beta : parseFloat($('.param#beta') .val()),
		gamma: parseFloat($('.param#gamma').val()),
		t 	 : parseInt  ($('.param#t')	.val()),
		w	 : parseFloat($('.param#w')	.val()),
		n  	 : parseInt  ($('.param#n')	.val())
	};

	// check if invalid number
	for (var i in data) {
		if (i == 'alpha' || i == 'beta' || i == 'gamma') {
			if (data[i] < 0 || data[i] > 1) {
				alert(i + " must be between 0-1!");
				$('#'+i).val('');
				return;
			}
		}
	}
	if (data.n == 0) {
		alert("n cannot be 0!");
		$('#n').val('');
		return;
	}

	// post request for adding games
	$.ajax({
		url:  "/admin/add_games",
		type: "POST",
		data: data,
		success: (res) => {
			if (res.success) {
				$parameters.val('');
				updateGames(res.games);
			} else {
				alert(res);
			}	
		}
	});

	removeCachedAvailableGames();
}

// update game table
const updateGames = (games) => {
	$gameTableBody.html("");
	games.forEach((g) => {
		$gameTableBody.append(
			"<tr>" +
				"<td class='alpha'>" + g.alpha + "</td>" +
				"<td class='beta'>"  + g.beta  + "</td>" +
				"<td class='gamma'>" + g.gamma + "</td>" +
				"<td class='t'>" 	 + g.t 	   + "</td>" +
				"<td class='w'>" 	 + g.w 	   + "</td>" +
				"<td class='n'>" 	 + g.n 	   + "</td>" +
				"<td><div class='delete'>Delete</div></td>" +
			"</tr>");
	});

}

// click add button to add participants
const addParticipants = () => {
	var number = parseInt($addParticipantsInput.val());
	$addParticipantsInput.val('');

	// check if invalid input 
	if (!number || number > 100){
		alert("Please enter an number in 1~100!");
		return;
	}

	// post request for adding participants
	$.ajax({
		url:  "/admin/add_participants",
		type: "POST",
		data: {number: number},
		success: (res) => {
			if (res.success){
				updateParticipants(res.participants, res.count);
			} else {
				alert(res);
			}
		}
	});
}

// update participant table
const updateParticipants = (participants, count) => {
	$("#count").html("Participants: " + count);
	$participantTableBody.html("");
	participants.forEach((p) => {
		$participantTableBody.append(
			"<tr" + (p.second ? " class='button'>" : ">") +
				"<td>" +
					 "<p>" + p.first + "</p>" + 
					 "<p>"+ (p.second ? p.second : "") + "</p>" +
				"</td>" +
				"<td>" + 
					(p.second ? "<p> 》 </p><div class='delete'>Delete</div>" : "") + 
				"</td>" + 
			"</tr>");
	});
	var start = (getCurrentPage() - 1) * PAGE_SIZE,
		end = Math.min(start + PAGE_SIZE, $("#participant-table-body tr").length);
	displayParticipants(start, end);
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

	var first = getFirst(),
		second = getSecond();
	showPair(first, second);
	
}

const showPair = (first, second) => {
	$("#first").text(first);
	$("#second").text(second);

	var games = getCachedPair(first, second);
	if (games != null) {
		refreshPairTable(games);
	} else {
		// post request for viewing a pair
		$.ajax({
			url:  "/admin/view_pair",
			type: "POST",
			data: {id: first},
			success: (res) => {
				if (res.success){
					refreshPairTable(res.games);
				} else {
					alert(res);
				}
			}
		});
	}
	viewAvailableGames(first, second);
}

const showDeletePair = (index) => {
	var $buttons = $participantTableBody.find("td .delete");
	var $text = $participantTableBody.find("tr").eq(index).find("p");
	if ($buttons.eq(index).css("display") == "none") {
		hideDelete();
		$buttons.eq(index).animate({width:'show'}, 300);
		$text.animate({marginLeft: "-=55px"}, 300);
		$text.addClass("moved");
	} else {
		hideDelete();
	}

}


const getCurrentPage = () => {
	return parseInt($pages.text());
}

const getPageCount = () => {
	return Math.ceil($participantTableBody.find("tr").length / PAGE_SIZE);
}

const displayParticipants = (start, end) => {
	var $rows = $participantTableBody.find("tr");
	$rows.hide();
	for (var i = start; i < end; i++){
		$rows.eq(i).show();
	}
	var pageCount = Math.ceil($rows.length / PAGE_SIZE);
	$pages.text(Math.ceil((start + 1) / PAGE_SIZE) + "/" + pageCount);
}

const previousPage = () => {
	var pageCount = getPageCount(),
		currentPage = getCurrentPage();
	if (currentPage > 1){
		var start = (currentPage - 2) * PAGE_SIZE,
			end = start + PAGE_SIZE;
		displayParticipants(start, end);
	}
}

const nextPage = () => {
	var pageCount = getPageCount(),
		currentPage = getCurrentPage();
	if (currentPage < pageCount){
		var start = currentPage * PAGE_SIZE,
			end = Math.min(start + PAGE_SIZE, $participantTableBody.find("tr").length);
		displayParticipants(start, end);
	}
}


// local storage of pair information
const cachePair = (first, second, games) => {
	window.sessionStorage.setItem(first + second, JSON.stringify(games));
}

const getCachedPair = (first, second) => {
	return JSON.parse(window.sessionStorage.getItem(first + second));
}

const removeCachedPair = (first, second) => {
	window.sessionStorage.removeItem(first + second);
}

// refresh games in the pair panel
const refreshPairTable = (games) => {
	$pairTableBody.html("");
	games.forEach((g) => {
		$pairTableBody.append(
			"<tr id='" + g.id + "'>" +
				"<td>" + g.buyer_id + "</td>" +
				"<td>" + g.seller_id+ "</td>" +
				"<td>" + g.alpha + "</td>" +
				"<td>" + g.beta + "</td>" +
				"<td>" + g.gamma + "</td>" +
				"<td>" + g.t + "</td>" +
				"<td>" + g.w + "</td>" +
				"<td>" +
					"<div class='delete'>Remove</div>" +
				"</td>" +
			"</tr>");
	});
	$("table.pair tfoot td").html("Total: " + games.length);

	var first = getFirst(),
		second = getSecond();
	cachePair(first, second, games);
}

// show the Remove button
const showRemove = (index) => {
	var $buttons = $pairTableBody.find(".delete");
	if ($buttons.eq(index).css("display") == "none") {
		hideDelete();
		$buttons.eq(index).animate({width:'show'}, 300);
	} else {
		hideDelete();
	}
}

// remove game from pair
const removeGame = (index) => {
	var $row = $pairTableBody.find("tr").eq(index);
	var gameId = $row.attr("id"),
		buyerId = $row.find("td").eq(0).text();
	// post request for removing a game
	$.ajax({
		url:  "/admin/remove_game",
		type: "POST",
		data: {
			gameId: gameId,
			buyerId: buyerId
		},
		success: (res) => {
			if (res.success){
				refreshPairTable(res.games);
				getAvailableGames();
			} else {
				alert(res);
			}
		}
	});

	removeCachedAvailableGames();
}

const viewAvailableGames = (first, second) => {
	$("#buyer").html(first);
	$("#seller").html(second);

	if (getCachedAvailableGames() == null){
		getAvailableGames();
	} else {
		showAvailableGames();
	}
}

// cache available games locally
const cacheAvailableGames = (games) => {
	window.sessionStorage.setItem("availableGames", JSON.stringify(games));
}

const getCachedAvailableGames = () => {
	return JSON.parse(window.sessionStorage.getItem("availableGames"));
}

const removeCachedAvailableGames = () => {
	window.sessionStorage.removeItem("availableGames");
}

// get all games that have not been assigned to pairs
const getAvailableGames = () => {
	$.ajax({
		url:  "/admin/get_available_games",
		type: "POST",
		data: {},
		success: (res) => {
			if (res.success){
				cacheAvailableGames(res.games);
				showAvailableGames();
			} else {
				alert(res);
			}
		}
	});
}


// show available games in table
const showAvailableGames = () => {
	var games = getCachedAvailableGames();
	$assignTableBody.html("");
	games.forEach((g) => {
		$assignTableBody.append(
			"<tr>" +
				"<td>" + 
					"<label class='checkbox'>" +
						"<input type='checkbox'>" +
						"<span class='checkmark'></span>" +
					"</label>" +
				"</td>" +
				"<td colspan='2'>" +
					"<label class='switch'>" +
				  		"<input class='role' type='checkbox'>" +
				 		"<div class='slider'>" +
				 			"<p>seller</p>" +
				 			"<p>seller</p>" +
				 		"</div>" +
					"</label>" +
				"</td>" +
				"<td class='assign' id='alpha'>" + g.alpha + "</td>" +
				"<td class='assign' id='beta'>" + g.beta + "</td>" +
				"<td class='assign' id='gamma'>" + g.gamma + "</td>" +
				"<td class='assign' id='t'>" + g.t + "</td>" +
				"<td class='assign' id='w'>" + g.w + "</td>" +
				"<td class='assign'>" + g.available +
					"<div class='delete'>Delete</div>" + 
				"</td>" +
			"</tr>");
	});
}

const showDeleteExtra = (index) => {
	var $buttons = $assignTableBody.find(".delete");
	if ($buttons.eq(index).css("display") == "none") {
		hideDelete();
		$buttons.eq(index).animate({width:'show'}, 300);
	} else {
		hideDelete();
	}
} 

const deleteExtraGames = (index) => {
	var data = {
		alpha: parseFloat($('.assign#alpha').eq(index).text()),
		beta : parseFloat($('.assign#beta') .eq(index).text()),
		gamma: parseFloat($('.assign#gamma').eq(index).text()),
		t 	 : parseInt  ($('.assign#t')	.eq(index).text()),
		w	 : parseFloat($('.assign#w')	.eq(index).text()),
	};
	console.log(data);

	// post request for deleting games
	$.ajax({
		url:  "/admin/delete_extra_games",
		type: "POST",
		data: data,
		success: (res) => {
			if (res.success){
				$assignTableBody.find("tr").eq(index).remove();
				updateGames(res.games);
			} else {
				alert(res);
			}
		}
	});

	window.sessionStorage.clear();

}

// assign games to the pair
const assignGames = () => {

	var first = getFirst(),
		second = getSecond();

	var games = [];
	$checkboxes = $(".checkbox input")
	$checkboxes.each(function(){
		if ($(this).prop("checked")){
			var i = $checkboxes.index(this);
			var seller, buyer;
			if ($(".role").eq(i).prop("checked")){
				seller = first;
				buyer = second;
			} else {
				seller = second;
				buyer = first;
			}
			var alpha = $(".assign#alpha").eq(i).text(),
				beta  = $(".assign#beta").eq(i).text(),
				gamma = $(".assign#gamma").eq(i).text(),
				t     = $(".assign#t").eq(i).text(),
				w     = $(".assign#w").eq(i).text();
			games.push({
				buyer_id: buyer,
				seller_id: seller,
				alpha: alpha,
				beta: beta,
				gamma: gamma,
				t: t,
				w: w
			});
		}
	});

	if (games) {
		$.ajax({
			url:  "/admin/assign_games_to_pair",
			type: "POST",
			data: {gamesString: JSON.stringify(games)},
			success: (res) => {
				if (res.success){
					removeCachedPair(first, second);
					showPair(first, second);
					removeCachedAvailableGames();
					viewAvailableGames(first, second);
				} else {
					alert(res);
				}
			}
		});
	}
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
	showDelete(index);
});

$gameTableBody.on("click", ".delete", (event) => {
	var index = $gameTableBody.find(".delete").index(event.currentTarget);
	deleteGames(index);
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
	addGames();
})

$addParticipantsButton.click(() => {
	addParticipants()
});

$participantTableBody.on("click", ".button", (event) => {
	var index = $participantTableBody.find(".button").index(event.currentTarget);
	hideDelete();
	viewPair(index);
})

$participantTableBody.on("click", ".focused", (event) => {
	var index = $participantTableBody.find(".button").index(event.currentTarget);
	// showDeletePair(index);
});

$leftButton.click(() => {
	previousPage();
});

$rightButton.click(() => {
	nextPage();
});

$pairTableBody.on("click", "tr", (event) => {
	var index = $pairTableBody.find("tr").index(event.currentTarget);
	showRemove(index);
});

$pairTableBody.on("click", ".delete", (event) => {
	var index = $pairTableBody.find(".delete").index(event.currentTarget);
	removeGame(index);
});

$assignTableBody.on("click", ".assign", (event) => {
	var number = $assignTableBody.find(".assign").index(event.currentTarget);
	var index = Math.floor(number / 6);
	showDeleteExtra(index);
});

$assignTableBody.on("click", ".delete", (event) => {
	var index = $assignTableBody.find(".delete").index(event.currentTarget);
	deleteExtraGames(index);
});


$assignGamesButton.click(() => {
	assignGames();
});


// show the Games tab
$("#Games").show();
// page the participants list
displayParticipants(0, PAGE_SIZE);


});

