// placemgr_info.js

function assignDateGlobals() {
	// needed dates
	PlaceMgr.currentDateTime = PlaceMgr.todaysDate.getTime(); 						// LIVE CODE: UTC Timestamp M-seconds
	//PlaceMgr.currentDateTime 	= new Date(2015, 9-1, 6, 19).getTime(); 							// pre-season for testing
	//PlaceMgr.currentDateTime 	= new Date(2015, 9-1, 18, 10).getTime(); 						// early voting open for testing
	//PlaceMgr.currentDateTime 	= new Date(2015, 9-1, 17, 17).getTime(); 						// early voting open for testing
	//PlaceMgr.currentDateTime 	= new Date(2015, 9-1, 19, 13).getTime(); 						// early voting closed for testing Sat
	//PlaceMgr.currentDateTime 	= new Date(2015, 9-1, 20, 13).getTime(); 						// early voting closed for testing Sun
	//PlaceMgr.currentDateTime 	= new Date(2015, 9-1, 17, 8).getTime(); 						// early voting closed for testing before hours
	//PlaceMgr.currentDateTime 	= new Date(2015, 9-1, 17, 19).getTime(); 						// early voting closed for testing after hours
	//PlaceMgr.currentDateTime 	= new Date(2015, 10-1, 5, 13).getTime(); 						// between elections weekday
	//PlaceMgr.currentDateTime 	= new Date(2015, 10-1, 3, 13).getTime(); 						// between elections weekend
	//PlaceMgr.currentDateTime 	= new Date(2015, 10-1, 8, 13).getTime(); 						// after elections
	//PlaceMgr.currentDateTime 	= new Date(2015, 10-1, 6, 13).getTime(); 						// election day open
	var theDate = new Date(PlaceMgr.currentDateTime);
	var date = theDate.getDate();
	var month = theDate.getMonth();
	var year = theDate.getFullYear();
	var dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
	PlaceMgr.currentDay = dayNames[theDate.getDay()]; 		// day of week local
	PlaceMgr.earlyOpensAt = new Date(year, month, date, 9).getTime(); // UTC Timestamp M-seconds
	PlaceMgr.earlyClosesAt = new Date(year, month, date, 18).getTime(); // UTC Timestamp M-seconds
	PlaceMgr.electionClosesAt = new Date(2015, 10 - 1, 6, 19).getTime(); // UTC Timestamp M-seconds
	PlaceMgr.electionOpensAt = new Date(2015, 10 - 1, 6, 7).getTime(); // UTC Timestamp M-seconds
	PlaceMgr.earlyVoteStart = new Date(2015, 9 - 1, 16, 18).getTime(); // UTC Timestamp M-seconds
	PlaceMgr.earlyVoteEnd = new Date(2015, 10 - 1, 2, 9).getTime(); // UTC Timestamp M-seconds

	//var PlaceMgr.earlyOpensAt 		= theLocation.earlyVotingDayStartTimeUTC; // 00:00
	//var PlaceMgr.earlyClosesAt 	= theLocation.earlyVotingEndTimeUTC; 		// 00:00
	//var PlaceMgr.electionClosesAt 	= theLocation.electionDayEndTimeUTC; 	// 00:00
	//var PlaceMgr.electionOpensAt 	= theLocation.electionDayStartTimeUTC; // 00:00

	PlaceMgr.isTodayEarlyVoting = (PlaceMgr.earlyVoteStart <= PlaceMgr.currentDateTime && PlaceMgr.currentDateTime <= PlaceMgr.earlyVoteEnd);
	console.log("EARLY VOTING?");
	console.log(PlaceMgr.earlyVoteStart + "+" + PlaceMgr.currentDateTime + "+" + PlaceMgr.currentDateTime + "+" + PlaceMgr.earlyVoteEnd);
	PlaceMgr.isTodayBetweenEarlyVotingAndElectionDayClose = (PlaceMgr.earlyVoteEnd < PlaceMgr.currentDateTime && PlaceMgr.currentDateTime <= PlaceMgr.electionClosesAt);
}

// function to calc wait time in minutes depending on accuracy of source or set to default large number
function assignLineCount(theId) {
	/*
	WHICH WINS
	special input wins
	unm input overwrites special user if it's unmBufferTime minutes or after the special user's input
	normal user overwrites special user if it's normalUserBufferTime minutes or after either the special user's input or the unm input

	WHEN EXPIRES
	if oldest (not most recent) used line count is older than the estimated time by 1.5, then it goes to unknown
	booth count we accept whatever the last input was period.
	*/
	// set up variables for logic to see if after hours or if line count is valid
	var closed = 200000;
	var unknown = 100000;
	var inActive = 300000;
	var theLocation = PlaceMgr.locations[theId];

	//PlaceMgr.earlyVoteStart 	= theLocation.earlyVotingStartDate; 		// UTC Timestamp M-seconds
	//PlaceMgr.earlyVoteEnd 		= theLocation.earlyVotingEndDate;			// UTC Timestamp M-seconds
	// take opportunity to set booleans for whether current day is within early Voting Period or is between early and Election Day


	console.log('date booleans for what day it is');
	console.log(PlaceMgr.isTodayEarlyVoting);
	console.log(PlaceMgr.isTodayBetweenEarlyVotingAndElectionDayClose);
	//console.log(PlaceMgr.isTodayElectionDay);
	console.log(theLocation);

	if ((PlaceMgr.isTodayBetweenEarlyVotingAndElectionDayClose && theLocation.isElectionDay === "n") ||
			(PlaceMgr.isTodayEarlyVoting && theLocation.isEarlyVoting === "n")) {
		return inActive;

	} else if ((PlaceMgr.isTodayEarlyVoting && PlaceMgr.currentDateTime > PlaceMgr.earlyClosesAt) ||
					(PlaceMgr.isTodayEarlyVoting && PlaceMgr.currentDateTime < PlaceMgr.earlyOpensAt) ||
					PlaceMgr.currentDay === "Sat" ||
					PlaceMgr.currentDay === "Sun" ||
					PlaceMgr.currentDateTime < PlaceMgr.earlyVoteStart ||
					(PlaceMgr.earlyVoteEnd < PlaceMgr.currentDateTime && PlaceMgr.currentDateTime < PlaceMgr.electionOpensAt) ||
					PlaceMgr.currentDateTime > PlaceMgr.electionClosesAt) {

		return closed;
	}



	// set calculation variables and defaults
	//var estimateMultiple = 1.5;
	//var avgPersonTime = 10;

	// these represent how old an approved or special user's input has to be to be considered invalid relative to newer inputs
	//var unmBufferTime = 1;
	var normalUserBufferTime = 1;
	var validLineCount;
	var validLastUpdate;
	//var validBoothCount = 10; // set default to guess of average amount across all locations
	//var validWaitTime;




	// get line count timestamp
	var unmMinutesOld = Number(PlaceMgr.unmData[theId].minutesold);
	//var specialDate = PlaceMgr.abqVotes[theId]["lineUpdatedAtSpecial"];
	var abqvDateTime = new Date(PlaceMgr.abqVotes[theId]["CreatedTimestamp"].replace(/-/g, "/")).getTime();
	//var myDate3 = Date.parseExact("2010-11-29", "yyyy-MM-dd");
	var timeZoneAdjustment = -60;
	var abqvMinutesOld = timeZoneAdjustment + (PlaceMgr.currentDateTime - abqvDateTime) / 60000;

	// variables should be in minutes, so if special is even older than the others by 1 minute it still wins
	//if ((unmDate - specialDate < unmBufferTime) && (normalDate -  specialDate < normalUserBufferTime)) {
	//	validLineCount = PlaceMgr.abqVotes[theId]["lineCountSpecial"];
	//	validLastUpdate = specialDate;
	//
	//} else
	if ((unmMinutesOld - abqvMinutesOld) > normalUserBufferTime) {
		//if (abqvMinutesOld > unmMinutesOld){
		validLineCount = PlaceMgr.abqVotes[theId]["PersonCount"];
		validLastUpdate = abqvMinutesOld;

	} else {
		validLineCount = PlaceMgr.unmData[theId].count;
		validLastUpdate = unmMinutesOld;
	}

	//// get booth count
	//var specialBoothDate = PlaceMgr.abqVotes[theId]["boothUpdatedAtSpecial"];
	//var normalBoothDate = PlaceMgr.abqVotes[theId]["boothUpdatedAt"];
	//
	//if (normalBoothDate - specialBoothDate < normalUserBufferTime){
	//	validBoothCount = PlaceMgr.abqVotes[theId]["boothCountSpecial"];
	//} else {
	//	validBoothCount = PlaceMgr.abqVotes[theId]["boothCount"];
	//}

	//validWaitTime = (1+ validLineCount) * avgPersonTime/validBoothCount;


	// logic to see if still valid, i.e. within last 30 minutes

	console.log("VALID LAST UPDATE: " + validLastUpdate + " + " + validLineCount + " + " + unmMinutesOld);
	//+ " + " + abqvMinutesOld + " + " + PlaceMgr.abqVotes[theId]["CreatedTimestamp"].replace(/-/g, "/") + " + " + abqvDateTime);
	if (validLastUpdate <= 30 || validLastUpdate <= (validLineCount * 2)) {
		theLocation["minutesOld"] = validLastUpdate;
		return validLineCount;
	}

	// this number of default hours indicates an invalid or "unknown" wait time.  Set to a high number so that it goes to the bottom on any sort, will display as "00:??"
	return unknown;

}

function getDisplayStrings(theId) {
	// build time string
	var lineCountGlyphString;
	var countString;
	var hoursSince;
	var theLocation = PlaceMgr.locations[theId];
	if (theLocation.lineCount === 200000) {
		// indicates closed
		countString = "";
		hoursSince = "";
		lineCountGlyphString = "<span class = 'glyphicon glyphicon-ban-circle' style = 'font-size: 16px;   top: 2px;  margin-left: 1px;'></span>";
	} else if (theLocation.lineCount === 300000) {
		// indicates closed AND inactive
		countString = "";
		hoursSince = "";
		lineCountGlyphString = " - ";
	} else if (theLocation.lineCount === 100000 || theLocation.lineCount > 200) {
		// indicates open but unknown wait time
		countString = "<strong>Line Length:</strong> <br/>Unknown - tap the report button above to let us know!<br/>";
		hoursSince = "";
		lineCountGlyphString = "<span class = 'glyphicon glyphicon-time' style = 'font-size: 14px;  top: 1px;   margin-left: 2px;'></span>" +
							"<span style = 'font-size: 15px;     line-height: 5px;'>?</span>";
		//} else if(theLocation.lineCount < 10) {
		//	lineCountGlyphString = "00:0" + theLocation.lineCount;
	} else {
		//var hours = Math.floor(theLocation.lineCount / 60);
		//var minutes = Math.round( ((theLocation.lineCount/60) - hours) *60);
		//if (minutes < 10) {
		//	lineCountGlyphString = hours + ":0" + minutes;
		//} else {
		//	lineCountGlyphString = hours + ":" + minutes;
		//}

		// indicates open but unknown wait time
		countString = "<strong>Line Length:</strong> <br/>" + theLocation.lineCount;

		// calculate number of hours since last updated wait estimat
		if (PlaceMgr.locations[theId].minutesOld > 0) {
			var hrs = Math.floor(PlaceMgr.locations[theId].minutesOld / 60);
			var min = ((PlaceMgr.locations[theId].minutesOld / 60 - hrs) * 60).toFixed(0);
			var h;
			var m;
			if (hrs < 1) {
				h = "";
			} else {
				h = hrs.toString() + "h ";
			}
			if (min < 1) {
				m = "";
			} else {
				m = min.toString() + "m ";
			}
			hoursSince = "<strong>Line Last Counted:</strong><br/>" + h + m + " ago.";
		}


		lineCountGlyphString = theLocation.lineCount;
	}

	theLocation["hoursSince"] = hoursSince;
	theLocation["countString"] = countString;
	return lineCountGlyphString;
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

//=============================================================================
// Feedback ability for dynInfoX
//=============================================================================

function submitReport() {

	var newCount = document.getElementById('lineCountInputLive').value.trim();
	if (!(0 <= newCount && newCount <= 200)) {
		alert('Please enter a number between 0 and 200 with no spaces or commas.');
		return;
	}

	if (newCount === "" || newCount === "undefined" || newCount === null) {
		showThankModal();
		return;
	}
	//var myArray1 = PlaceMgr.all;
	//var index1 = myArray1.map(function(e) { return e.OBJECTID; }).indexOf(PlaceMgr.nearest.OBJECTID);
	//PlaceMgr.all[index1].lineCount = newCount;
	//
	//var myArray2 = PlaceMgr.zoomList;
	//var index2 = myArray2.map(function(e) { return e.OBJECTID; }).indexOf(PlaceMgr.nearest.OBJECTID);
	//PlaceMgr.zoomList[index2].lineCount = newCount;
	//console.log("ZOOMLIST" + PlaceMgr.zoomList[index2]);

	var theId = "id" + PlaceMgr.nearest.OBJECTID;
	PlaceMgr.locations[theId].lineCount = newCount;
	PlaceMgr.locations[theId].minutesOld = 1;
	PlaceMgr.locations[theId].lineCountGlyph = getDisplayStrings(theId);

	/* JKH todo - use link to dev-provided database, name
	var url10 = "http://abqvotes.org/placemgr_getDynInfo.php?loc=" + PlaceMgr.nearest.OBJECTID + "&persons=" + newCount;
	console.log("http://abqvotes.org/placemgr_getDynInfo.php?loc=" + PlaceMgr.nearest.OBJECTID + "&persons=" + newCount);
	*/
	var url10 = "file://placemgr_getDynInfo.php?loc=" + PlaceMgr.nearest.OBJECTID + "&persons=" + newCount;
	console.log("file://placemgr_getDynInfo.php?loc=" + PlaceMgr.nearest.OBJECTID + "&persons=" + newCount);
	$.ajax({
		type: 'GET',
		url: url10,
		//dataType	: 'json',
		//async		: false,
		//cache		: true,
		success: function () {
			rebuildAll();
		},
		error: function () {
			rebuildAll();
		}

	});
	showThankModal();

}


// modal to submit wait time form.
function confirmReport() {
	// ensure it opens at top of modal.
	$("#confirmModal").scrollTop(0);
	// edit report modal stub
	document.getElementById('confirmedLocation').innerHTML = PlaceMgr.nearest.MVCName;
	document.getElementById('modalReportButton').value = PlaceMgr.nearest.OBJECTID;
	document.getElementById('modalReportButton').setAttribute('id', 'liveReportButton');
	document.getElementById('lineCountInput').setAttribute('id', 'lineCountInputLive');


	// set into modal stub
	document.getElementById('modalBody').innerHTML = document.getElementById('confirmReportModal').innerHTML;

	// reset template
	document.getElementById('liveReportButton').setAttribute('id', 'modalReportButton');
	document.getElementById('lineCountInputLive').setAttribute('id', 'lineCountInput');
}

// modal to verify location
function checkReportLocation() {
	$('#splashModal').modal("hide");

	if (PlaceMgr.isSearchDone === false) {
		document.getElementById('modalBody').innerHTML = document.getElementById('stillWaitingModalReport').innerHTML;
		PlaceMgr.isWaiting = true;

	} else {

		// first, make sure it is election season JKH
		if (PlaceMgr.isTodayBetweenEarlyVotingAndElectionDayClose === false) {
			showNonElectionTimeError();
		}

		// next, check to see if we have their current location at all
		else if (PlaceMgr.isCurrent === false) {
			showReportError();
		}

		// next, check to see if they are within the required range of the location
		else if (PlaceMgr.nearest["Distance"] < PlaceMgr.requiredRange) {
			// edit report modal stub
			document.getElementById('reportItems').innerHTML = PlaceMgr.nearest.MVCName;

			// set into modal stub
			document.getElementById('modalBody').innerHTML = document.getElementById('confirmLocationModal').innerHTML;
		} else {
			notNearEnoughModal();
		}
	}
}
