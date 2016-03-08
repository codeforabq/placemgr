// placemgr_filters.js 

///////////////////////////////////////////////////////////////////////////////////
/*
* All filter related functions
*
*
*
*/

// sort list by lineCount or by distance
function sortArray(isWhatType) {
	console.log("sortArray fires now");

	var theArray = PlaceMgr.zoomList;

	//check type of sort
	if (isWhatType === 'default') {
		console.log("sortArray DEFAULT fires now");
		theArray.sort(function (a, b) {
			return a.Distance - b.Distance
		});

		// grab nearest location into global for reporting of line length
		//PlaceMgr.nearest = PlaceMgr.locations["id8"];
		//PlaceMgr.nearest.Distance = .1;
		PlaceMgr.nearest = PlaceMgr.zoomList[0];
		console.log('nearest location is ' + PlaceMgr.nearest);

	} else if (isWhatType === 'time') {
		console.log("sortArray TIME fires now");
		ga('send', 'event', 'button', 'click', 'sortByTime');

		document.getElementById('byLowestLive').style.backgroundColor = "#A54A4A";
		document.getElementById('byLowestLive').style.color = "wheat";
		document.getElementById('lowestCaretLive').className = "caret";

		document.getElementById('byNearestLive').style.backgroundColor = "#E4C9C9 ";
		document.getElementById('byNearestLive').style.color = "#999999";
		document.getElementById('nearestCaretLive').className = "right-caret";

		document.getElementById('byNameLive').style.backgroundColor = "#E4C9C9 ";
		document.getElementById('byNameLive').style.color = "#999999";
		document.getElementById('nameCaretLive').className = "right-caret";

		// JKH todo - change lineCount to dynInfox
		theArray.sort(function (a, b) {
			return a.lineCount - b.lineCount
		});
		console.log('nearest location is ' + PlaceMgr.nearest);

	} else if ((isWhatType === 'distance')) {
		console.log("sortArray DISTANCE fires now");
		ga('send', 'event', 'button', 'click', 'sortByDistance');

		document.getElementById('byNearestLive').style.backgroundColor = "#A54A4A";
		document.getElementById('byNearestLive').style.color = "wheat";
		document.getElementById('nearestCaretLive').className = "caret";


		document.getElementById('byLowestLive').style.backgroundColor = "#E4C9C9 ";
		document.getElementById('byLowestLive').style.color = "#999999";
		document.getElementById('lowestCaretLive').className = "right-caret";

		document.getElementById('byNameLive').style.backgroundColor = "#E4C9C9 ";
		document.getElementById('byNameLive').style.color = "#999999";
		document.getElementById('nameCaretLive').className = "right-caret";

		theArray.sort(function (a, b) {
			return a.Distance - b.Distance
		})
	} else if ((isWhatType === 'name')) {
		console.log("sortArray NAME fires now");
		ga('send', 'event', 'button', 'click', 'sortByName');

		document.getElementById('byNameLive').style.backgroundColor = "#A54A4A";
		document.getElementById('byNameLive').style.color = "wheat";
		document.getElementById('nameCaretLive').className = "caret";

		document.getElementById('byLowestLive').style.backgroundColor = "#E4C9C9 ";
		document.getElementById('byLowestLive').style.color = "#999999";
		document.getElementById('lowestCaretLive').className = "right-caret";

		document.getElementById('byNearestLive').style.backgroundColor = "#E4C9C9 ";
		document.getElementById('byNearestLive').style.color = "#999999";
		document.getElementById('nearestCaretLive').className = "right-caret";

		theArray.sort(function (a, b) {
			if (a.MVCName < b.MVCName) return -1;
			if (a.MVCName > b.MVCName) return 1;
			return 0;
		})
	}
	//console.log ('zoomList AFTER SORT: ');
	//console.log (PlaceMgr.zoomList);

	//reset the sort boolean to new value
	PlaceMgr.isSortByType = isWhatType;
}

//=============================================================================
// Functions for dynInfoX
// JKH
//=============================================================================

// TOGGLING ALL filters

function setFilterRadios(type) {
	console.log('setFilterRadios fires now with type:' + type);

	// make sure both checkboxes are checked
	document.getElementById(type + "BoxLive").checked = true;
	document.getElementById(type + "BoxMobile").checked = true;

	// move map to nearby location to absentee locations
	if (type === "absentee") {
		map.setView([PlaceMgr.lat, PlaceMgr.lng + PlaceMgr.latlngAdjustment], 12);
	}

	// rebuild all.
	rebuildAll();

	/* may activate and build on this if performance becomes an issue
	if (type === "all"){
	// show all icons by unhiding any that are hidden
	showIconsByType(type);
	}else if (type === "early"){
	// show only early locations by hiding any with class "allLocations" and rebuilding list
	showIconsByType(type);
	hideIconsByType("all");

	}else if (type === "absentee"){
	// show only absentee locations by hiding any with class "allLocations" or class "absenteeLocations" and rebuilding List
	showIconsByType(type);
	hideIconsByType("all");
	hideIconsByType("early");

	}*/
}

// Show only early voting
function showIconsByType(type) {
	console.log('hideIconsByType fires now');

	// hide all non-early location icons on map
	var icons = document.getElementsByClassName(type + "Locations");
	var index;

	if (icons[0].style.visibility === "visible") {
		for (index = 0; index < icons.length; index++) {
			icons[index].style.visibility = "visible";
		}
	}

	// close last opened popup
	map.closePopup();
}

function hideIconsByType(type) {
	console.log('hideIconsByType fires now');

	// hide all non-early location icons on map
	var icons = document.getElementsByClassName(type + "Locations");
	var index;

	if (icons[0].style.visibility === "visible") {
		for (index = 0; index < icons.length; index++) {
			icons[index].style.visibility = "hidden";
		}
	}

	// close last opened popup
	map.closePopup();
}


// Max Wait FILTER
// change max wait, apply if checkbox is checked
function changeMaxWait(input) {
	console.log('changeMaxWait fires now');

	// ensure input is number format and reset maxWait to value of input
	PlaceMgr.maxWait = Number(input);

	// ensure both
	document.getElementById("theMaxWait").value = PlaceMgr.maxWait;
	document.getElementById("theMobileMaxWait").value = PlaceMgr.maxWait;


	if (document.getElementById("isMaxWait").checked) {
		rebuildAll();
	}

}

// toggle maxWait on
function selectMaxWait() {
	console.log('selectMaxWait fires now');

	// switch onclick function for max wait checkboxes
	document.getElementById("isMaxWait").setAttribute("onclick", "unselectMaxWait()");
	document.getElementById("isMobileMaxWait").setAttribute("onclick", "unselectMaxWait()");

	// make sure both checkboxes are "checked"
	document.getElementById("isMaxWait").checked = true;
	document.getElementById("isMobileMaxWait").checked = true;

	rebuildAll();

}

// toggle maxWait off
function unselectMaxWait() {
	console.log('unselectMaxWait fires now');

	// assign current max wait to temp value
	var tempMaxWait = PlaceMgr.maxWait;

	// set maxWait to large number to show all locations
	PlaceMgr.maxWait = 10000;

	// switch onclick function for max wait checkbox
	document.getElementById("isMaxWait").setAttribute("onclick", "selectMaxWait()");
	document.getElementById("isMobileMaxWait").setAttribute("onclick", "selectMaxWait()");

	// make sure both checkboxes are not "checked"
	document.getElementById("isMaxWait").checked = false;
	document.getElementById("isMobileMaxWait").checked = false;

	// rebuild all layers
	rebuildAll();

	// reset maxWait to previous number
	PlaceMgr.maxWait = tempMaxWait;
}




// Max Distance FILTER
// change max distance, apply if checkbox is checked
function changeMaxDistance(miles) {
	console.log('changeMaxDistance fires now');

	// ensure input is number format and reset maxDistance to value of input
	PlaceMgr.maxDistance = Number(miles);

	// ensure both
	document.getElementById("theMaxDistance").value = PlaceMgr.maxDistance;
	document.getElementById("theMobileMaxDistance").value = PlaceMgr.maxDistance;


	if (document.getElementById("isMaxDistance").checked) {
		rebuildAll();
	}

}

// toggle maxDistance on
function selectMaxDistance() {
	console.log('selectMaxDistance fires now');

	// switch onclick function for max wait checkboxes
	document.getElementById("isMaxDistance").setAttribute("onclick", "unselectMaxDistance()");
	document.getElementById("isMobileMaxDistance").setAttribute("onclick", "unselectMaxDistance()");

	// make sure both checkboxes are "checked"
	document.getElementById("isMaxDistance").checked = true;
	document.getElementById("isMobileMaxDistance").checked = true;

	rebuildAll();

}

// toggle maxDistance off
function unselectMaxDistance() {
	console.log('unselectMaxDistance fires now');

	// assign current max wait to temp value
	var tempMaxDistance = PlaceMgr.maxDistance;

	// set maxDistance to 0 to show all locations
	PlaceMgr.maxDistance = 10000;


	// switch onclick function for max wait checkbox
	document.getElementById("isMaxDistance").setAttribute("onclick", "selectMaxDistance()");
	document.getElementById("isMobileMaxDistance").setAttribute("onclick", "selectMaxDistance()");

	// make sure both checkboxes are not "checked"
	document.getElementById("isMaxDistance").checked = false;
	document.getElementById("isMobileMaxDistance").checked = false;

	// rebuild all layers
	rebuildAll();


	// reset maxDistance to previous number
	PlaceMgr.maxDistance = tempMaxDistance;
}


// Early voting FILTER
// change early voting date, apply if checkbox is checked
function changeEarlyVotingDate(earlyDate) {
	console.log('changeEarlyVotingDate fires now');

	// reset earlyVotingDate to value of input
	PlaceMgr.earlyVotingDate = earlyDate;

	// ensure both
	document.getElementById("isEarlyVotingDatepicker").value = PlaceMgr.earlyVotingDate;
	document.getElementById("isEarlyVotingMobileDatepicker").value = PlaceMgr.earlyVotingDate;


	if (document.getElementById("isEarlyVoting").checked) {
		rebuildAll();
	}

}

// toggle earlyVoting on
function selectEarlyVoting() {
	console.log('selectEarlyVoting fires now');

	// switch onclick function for max wait checkboxes
	document.getElementById("isEarlyVoting").setAttribute("onclick", "unselectEarlyVoting()");
	document.getElementById("isEarlyVotingMobile").setAttribute("onclick", "unselectEarlyVoting()");

	// make sure both checkboxes are "checked"
	document.getElementById("isEarlyVoting").checked = true;
	document.getElementById("isEarlyVotingMobile").checked = true;

	rebuildAll();

}

// toggle earlyVoting off
function unselectEarlyVoting() {
	console.log('unselectEarlyVoting fires now');

	// switch onclick function for max wait checkbox
	document.getElementById("isEarlyVoting").setAttribute("onclick", "selectEarlyVoting()");
	document.getElementById("isEarlyVotingMobile").setAttribute("onclick", "selectEarlyVoting()");

	// make sure both checkboxes are not "checked"
	document.getElementById("isEarlyVoting").checked = false;
	document.getElementById("isEarlyVotingMobile").checked = false;

	// rebuild all layers
	rebuildAll();

}

function reactToDate() {

	console.log("reactToDate FIRES");
	if (PlaceMgr.isTodayEarlyVoting) {
		console.log("early voting FIRES");

		// make sure both early checkboxes are checked
		document.getElementById("earlyBoxLive").checked = true;
		//document.getElementById("earlyBox").checked = true;
		document.getElementById("earlyBoxMobile").checked = true;
	} else {
		console.log("not early voting FIRES");

		// make sure both all checkboxes are checked
		document.getElementById("allBoxLive").checked = true;
		//document.getElementById("allBox").checked = true;
		document.getElementById("allBoxMobile").checked = true;

		if (PlaceMgr.isTodayBetweenEarlyVotingAndElectionDayClose) {
			console.log("between elections FIRES");

			// and hide mobile filter button and list filter button, reveal brigade logo in its place
			//document.getElementById("subtractFromList1Live").style.display = "none";
			document.getElementById("headerFilterButton").style.display = "none";
			//document.getElementById("headerLogo").style.display = "inline";
		} else {
			console.log("before/after season of elections FIRES");

			// JKH - sets error and displays msg "not election season, check back later"
			// make sure filter options are visible
			//document.getElementById("subtractFromList1Live").style.display = "table";
			document.getElementById("headerFilterButton").style.display = "block";
			//document.getElementById("headerLogo").style.display = "none";
		}
	}
}


///////////////////////////////////////////////////////////////////////////////////
/*
* DropDown Menu Manipulations: opens dropdowns within the dropdown
* todo fixme: deprecated unless we have more filter options.
*
*
*/

function showBasics() {
	console.log('showBasics fired');
	document.getElementById('hiddenBasics').style.display = "inline-block";
	document.getElementById('basicsHr').style.display = "block";
	document.getElementById('basicsButton').setAttribute("onclick", "hideBasics()");
}

function hideBasics() {
	console.log('hideBasics fired');
	document.getElementById('hiddenBasics').style.display = "none";
	document.getElementById('basicsHr').style.display = "none";
	document.getElementById('basicsButton').setAttribute("onclick", "showBasics()");
}

function showSort() {
	console.log('showSort fired');
	document.getElementById('hiddenSort').style.display = "inline-block";
	document.getElementById('sortHr').style.display = "block";
	document.getElementById('sortButton').setAttribute("onclick", "hideSort()");
}

function hideSort() {
	console.log('hideSort fired');
	document.getElementById('hiddenSort').style.display = "none";
	document.getElementById('sortHr').style.display = "none";
	document.getElementById('sortButton').setAttribute("onclick", "showSort()");
}

function showReset() {
	console.log('showReset fired');
	document.getElementById('hiddenReset').style.display = "inline-block";
	//document.getElementById('resetHr').style.display = "block";
	document.getElementById('resetButton').setAttribute("onclick", "hideReset()");
	var myDiv = document.getElementById("filterDrowdownArea");
	myDiv.scrollTop = myDiv.scrollHeight;
}

function hideReset() {
	console.log('hideReset fired');
	document.getElementById('hiddenReset').style.display = "none";
	//document.getElementById('resetHr').style.display = "none";
	document.getElementById('resetButton').setAttribute("onclick", "showReset()");
	var myDiv = document.getElementById("filterDrowdownArea");
	myDiv.scrollTop = myDiv.scrollHeight;
}

function hideFilterBar() {
	document.getElementById("collapsingFilter").innerHTML = "SHOW FILTER OPTIONS";
	document.getElementById('collapsingFilter').setAttribute("onclick", "showFilterBar()");
}

function showFilterBar() {
	document.getElementById("collapsingFilter").innerHTML = "HIDE FILTER OPTIONS";
	document.getElementById('collapsingFilter').setAttribute("onclick", "hideFilterBar()");
}
