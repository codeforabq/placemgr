// placemgr_msgs.js

//=============================================================================
// Error reporting functions
//=============================================================================

// modal to display non-election time error modal for reporting.
function showNonElectionTimeError() {
	// ensure it opens at top of modal.
	$("#confirmModal").scrollTop(0);

	// set into modal stub
	document.getElementById('modalBody').innerHTML = document.getElementById('nonElectionTimeError').innerHTML;
}

// modal to display location error modal for reporting.
function showReportError() {
	// ensure it opens at top of modal.
	$("#confirmModal").scrollTop(0);

	// set into modal stub
	document.getElementById('modalBody').innerHTML = document.getElementById('reportModalError').innerHTML;
}

function notNearEnoughModal() {
	// ensure it opens at top of modal.
	$("#confirmModal").scrollTop(0);

	// set into modal stub
	document.getElementById('modalBody').innerHTML = document.getElementById('notNearEnoughModal').innerHTML;
}

// modal to display report thank you, links, and confirmation
function showThankModal() {
	// ensure it opens at top of modal.
	$("#confirmModal").scrollTop(0);

	// set into modal stub
	document.getElementById('modalBody').innerHTML = document.getElementById('thankModal').innerHTML;
}

// modal to close report modal
function closeModal() {
	$('#confirmModal').modal("hide");

	// set into modal stub
	//document.getElementById('modalBody').innerHTML = document.getElementById('reportModalError').innerHTML;
}

// function to close splash to find location
function closeSplash() {
	if (PlaceMgr.isSearchDone === false) {
		PlaceMgr.isWaitingSplash = true;
		document.getElementById('splashModalBody').innerHTML = document.getElementById('stillWaitingModalSplash').innerHTML;
	} else {
		$('#splashModal').modal("hide");
		$("body").scrollTop(0);
	}
}

function showLightReading() {
	console.log('showLightReading fired');
	document.getElementById('lightReading').style.display = "block";
}
// modal to close splash and show report modal
//function closeSplashOpenReport(){
//	if (PlaceMgr.isSearchDone){
//		document.getElementById('modalBody').innerHTML = document.getElementById('thankModal').innerHTML;
//
//	} else {
//		PlaceMgr.isWaiting = true;
//		//alert ("One second - still looking for your location...");
//	}
//	$('#splashModal').modal("hide");
//	checkReportLocation();
//
//
//}
