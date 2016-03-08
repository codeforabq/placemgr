/**
* placemgr_windows.js is a collection of functions
*
* 08/17/15 Created by Zach Grant
* 02/23/16 Generalized and renamed by Julie Hill 
*/

// JKH - todo - add if(console) code to avoid warnings, errors

console.log('start script');

//=============================================================================
// code to extend L.Marker and enable adding of id's to each marker --
// KEEP THIS FUNCTION AT TOP
//=============================================================================

(function (L) {

	/*
	 * by tonekk. 2014, MIT License
	 */

	L.ExtendedDivIcon = L.DivIcon.extend({
		createIcon: function(oldIcon) {
			var div = L.DivIcon.prototype.createIcon.call(this, oldIcon);

			if(this.options.id) {
				div.id = this.options.id;
			}

			if(this.options.style) {
				for(var key in this.options.style) {
					div.style[key] = this.options.style[key];
				}
			}

			return div;
		}
	});

	L.extendedDivIcon = function(options) {
		return new L.ExtendedDivIcon(options);
	}
})(window.L);


///////////////////////////////////////////////////////////////////////////////////
/*
 * Set up Map and necessary layers and variables
 *
 *
 *
 */

// create global window
window.PlaceMgr = window.PlaceMgr || {};

console.log('next set up map:');

// set up map
map = L.map('map', {closePopupOnClick: true, zoomControl: false});
new L.Control.Zoom({position: 'topright'}).addTo(map);

console.log('next set up tile layer:');

L.tileLayer(
	//'http://services.arcgisonline.com/arcgis/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
	'http://services.arcgisonline.com/arcgis/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
	//'http://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
	{
		attribution: "Esri, HERE, DeLorme, USGS, Intermap, increment P Corp., NRCAN, Esri Japan, METI, " +
		"Esri China (Hong Kong), Esri (Thailand), MapmyIndia, © OpenStreetMap contributors, and the GIS User Community ",
		noWrap: 'true'
	}).addTo( map );


console.log('next set up globals:');

// LAYERS
// layer to hold all location icons and add to map
PlaceMgr.locationsLayer = L.layerGroup().addTo(map);

// layer to hold all original icons,  add to map
PlaceMgr.allIconsLayer = L.layerGroup().addTo(map);

//set up arrays to hold location info and heatmap
PlaceMgr.all = [];
PlaceMgr.locations = [];

PlaceMgr.zoomList = [];
PlaceMgr.heat = [];
PlaceMgr.maxWait = 60;   // jkh - genericize this dynInfo1
PlaceMgr.maxDistance = 3;
PlaceMgr.requiredRange = 0.2; // min range in miles from a location to allow line reporting

// set global variable to adjust location to center of off-center map view when list is overlayed on left of map.
PlaceMgr.latlngAdjustment = 0;

// set up sort booleans for re-sorting when new items added or removed from all location array
PlaceMgr.isSortByType = 'distance';
PlaceMgr.isFilteredBy = 'early';

// set up current location boolean for use in reporting line, and also the booleans for whether or not user is waiting to see report modal.
PlaceMgr.isCurrent = false;
PlaceMgr.isWaiting = false;
PlaceMgr.isWaitingSplash = false;
PlaceMgr.isSearchDone = false;

// amount to adjust zoomList bounds so that they show on list at first load (but filter down some as you zoom in)
PlaceMgr.adjustBounds = .04;

// boolean to see which settings to default to
//PlaceMgr.isTodayEarlyVoting = true;

// boolean to determine whether or not list has already been built for radio button checking
PlaceMgr.isFirstBuild = true;
PlaceMgr.isTooFar = false;

PlaceMgr.unmData = [];
PlaceMgr.abqVotes = [];

// set datasource -- override on URL with "data=UNM | CABQ"
PlaceMgr.datasource = "CABQ";
tmp = getQueryVariable("data");
if(tmp=="UNM" || tmp=="CABQ") {
	PlaceMgr.datasource = tmp;
}

// set election day indicator -- override on URL with "electionday=Y"
PlaceMgr.isTodayElectionDay = false;
PlaceMgr.electionDate = new Date(2015,10-1,6); // this is UTC
PlaceMgr.earlyVotingDate = new Date();

PlaceMgr.todaysDate = new Date();
tmp = getQueryVariable("electionday");
if(tmp=="y" || PlaceMgr.todaysDate.toDateString()==PlaceMgr.electionDate.toDateString()) {
	PlaceMgr.isTodayElectionDay = true;
	document.getElementById('list-voting-early').style.display = "none";
	document.getElementById('voting-early').style.display = "none";
}

// set up all other date globals
assignDateGlobals();

console.log('=====================================');
console.log(PlaceMgr);
console.log('next set up data:');

// pull in data from API, assign to global locations array
if(PlaceMgr.datasource=="UNM") {
	//var url = "data/placemgr.json";
	var url = "http://where2vote.unm.edu/locationinfo/";
	$.ajax({
		url     : url,
		dataType: 'json',
		cache: true,
		success : function(data) {
			var theThing = 1;
			console.log("UNM DATA: " + data);
			console.log(data);
			for(x in data) {
				data[x].count = 7 + theThing;
				var theId = "id" + data[x].UniqueID;
				PlaceMgr.locations[theId] = data[x];
				theThing++;
			}

			console.log(PlaceMgr.locations);
			setBaseLocation();
			checkForLocations(PlaceMgr.lat, PlaceMgr.lng);
			findCurrentLocation();
		}
	});
} else
{
	var url = "http://coagisweb.cabq.gov/arcgis/rest/services/public/Voting2015/MapServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=json";

	var result = '';
	$.ajax({
		//type		: 'GET',
		url     : url,
		dataType: 'json',
		async: false,
		cache: true,
		success : function(text) {
			//result= JSON.parse(text);
			data=text.features;
			console.log(data);

			// get UNM data on election day
			//if(PlaceMgr.isTodayElectionDay==true){
				var url2 = "http://where2vote.unm.edu/locationinfo/";
				$.ajax({
					type		: 'GET',
					url     	: url2,
					dataType	: 'json',
					async		: false,
					cache		: true,
					success 	: function(unmData) {
						console.log("unmData FIRES:");
						console.log(unmData);
						// assign id to each object
						for (x in unmData) {
							var theId = "id" + unmData[x].OBJECTID;
							unmData[x].count = Number(unmData[x].count);
							PlaceMgr.unmData[theId] = unmData[x];

						}
						console.log("unmData FIRED:");
						console.log(PlaceMgr.unmData);

					},
					error: function(){
						PlaceMgr.unmData = [];
					}

				});
			//} else {
			//	PlaceMgr.unmData = [];
			//}

/*
			// JKH - this doesn't work as is; fires a function error
			// get data from abqvotes db:
			// fixme: switch this to the right url and take out the hard coded stuff once db is set up
			//var url3 = "http://getmytap.com/placemgr_getDynInfo.php?loc=1";
			//var url3 = "http://abqvotes.org/placemgr_getDynInfo.php?loc=1";
			var url3 = "http://abqvotes.org/placemgr_getDynInfo.php";
			$.ajax({
				type		: 'GET',
				url     	: url3,
				dataType	: 'json',
				async		: false,
				cache		: true,
				success 	: function(abqvData) {
					// fixme: take out hardcoded db values
					console.log ('abqvdata fires!');
					console.log (abqvData);
					//var theThing3 = 1;
					for (x in abqvData){
						var theId = "id" + abqvData[x].LocationId;

						// assign id to each object
						//abqvData[x].PersonCount = theThing3 + 20
						PlaceMgr.abqVotes[theId] = abqvData[x];
						//theThing3++;


						//if (theId === "id1" || theId === "id2" || theId === "id3") {
						//	console.log("LOCATION ID:" + theId);
						//	console.log("Created:" + abqvData[x].CreatedTimestamp);
						//}

						//PlaceMgr.abqVotes[theId]["lineCount"] = theThing3 + 20;
						//PlaceMgr.abqVotes[theId]["boothCount"] = theThing3 + 10;
						//PlaceMgr.abqVotes[theId]["boothUpdatedAt"] = new Date();
						//PlaceMgr.abqVotes[theId]["lineUpdatedAt"] = new Date();
						//
						//PlaceMgr.abqVotes[theId]["lineCountSpecial"] = theThing3 + 40;
						//PlaceMgr.abqVotes[theId]["boothCountSpecial"] = theThing3 + 5;
						//PlaceMgr.abqVotes[theId]["boothUpdatedAtSpecial"] = new Date();
						//PlaceMgr.abqVotes[theId]["lineUpdatedAtSpecial"] = new Date();
					}
				},
				error: function(){
					console.log ("AJAX FAILED");  // JKH - this fires due to jquery.js, XMLHttpRequest cannot load
					PlaceMgr.abqVotes = [];
				}

			});
*/
			//var hardcodedWaitTimes = [100, 6, 68, 12, 100000, 200000];
			for(x in data) {
				var objectId = data[x].attributes.OBJECTID;
				var theId = "id" + objectId;
				PlaceMgr.locations[theId] = data[x].attributes;
				// repeat latitude and longitude data in array using variable names from UNM data, so all other functions work without extra logic for variable naming differences
				PlaceMgr.locations[theId]["lat"] = data[x].geometry.y;
				PlaceMgr.locations[theId]["lon"] = data[x].geometry.x;
				// add variables to array that are using in future functions
				//PlaceMgr.locations[theId]["lineCount"] = hardcodedWaitTimes[Math.floor(Math.random()*hardcodedWaitTimes.length)];
				PlaceMgr.locations[theId]["minutesOld"] = "";
				PlaceMgr.locations[theId]["lineCount"] = assignLineCount(theId);
				PlaceMgr.locations[theId]["lineCountGlyph"] = getDisplayStrings(theId);

				PlaceMgr.locations[theId]["UniqueID"] = objectId;
				PlaceMgr.locations[theId]["MVCName"] = data[x].attributes.name;


				// fixme: preserved code in case my nesting attempt above fails

				//if(PlaceMgr.isTodayElectionDay==true)
				//{
				//	var url2 = "http://where2vote.unm.edu/locationinfo/";
				//	$.ajax({
				//		url     : url2,
				//		dataType: 'json',
				//		cache: true,
				//		success : function(data) {
				//			for(x in data) {
				//				for (i in PlaceMgr.locations) {
				//					if(data[x].MVCName==PlaceMgr.locations[i].name)
				//					{
				//						if(data[x].count > 0) {
				//							PlaceMgr.locations[i]["unmCount"] = data[x].count;
				//						}
				//						PlaceMgr.locations[i]["unmLastUpdate"] = data[x].lastupdate;
				//						PlaceMgr.locations[i]["unmMinutesOld"] = data[x].minutesold;
				//					}
				//				}
				//			}
				//		}
				//	});
				//}
			}
			console.log(PlaceMgr.locations);
			setBaseLocation();
			checkForLocations(PlaceMgr.lat, PlaceMgr.lng);
			findCurrentLocation();
			reactToDate();
		}
	});
}

//=============================================================================
// functions
//=============================================================================

///////////////////////////////////////////////////////////////////////////////////
/*
 * Set View using Location Data
 *
 *
 *
 */

// set view to default address, then get current location or keep to default runner base address

function setBaseLocation (lat, lng) {
	console.log ('setBaseLocation fires now');
	PlaceMgr.lat = 35.077982299999995;
	PlaceMgr.lng = -106.643478;

	var voterLatLong = [PlaceMgr.lat, PlaceMgr.lng];

	var adjustedLatLong = [PlaceMgr.lat, PlaceMgr.latlngAdjustment + PlaceMgr.lng];
	map.setView(adjustedLatLong, 11);

	//var currentLocationButton;
	//currentLocationButton = "<br/><button class='btn btn-danger btn-xs' id = 'homePopupButton' onClick='tryAgain()'>Try Current Location Again</button></div>";

	// build variable for popup display
	var locationDetails2 =	"<div style = 'text-align: center'><strong>We couldn't find you.  Try turning on locations services for your browser and refresh page.</strong>";
	//+ currentLocationButton;

	// build html to use in icon
	var homeMarker = "ABQ" +
		"<div class='leaflet-popup-tip-container' style='margin-top: 4px; margin-left: 0px'>" +
		"<div class='leaflet-popup-tip your-location-pointer'></div></div> ";

	var iconAnchor2 = turf.point([PlaceMgr.lng, PlaceMgr.lat]);

	// build custom icon
	myAddressIcon = L.divIcon({
		iconSize   	: [40, 30],
		className  	: "address-icon",
		iconAnchor 	: iconAnchor2,
		popupAnchor	: [0, -35],
		html       	: homeMarker
	});

	// build popup for use in switching
	PlaceMgr.addressPopup = L.popup().setContent(locationDetails2);

	// add icon to map with popup
	L.marker(voterLatLong, {icon: myAddressIcon, title: "Home Address"}).addTo(PlaceMgr.locationsLayer)
		.bindPopup(PlaceMgr.addressPopup);
}

function findCurrentLocation() {
	map.locate();
	map.on('locationfound', onLocationFound);
	map.on('locationerror', onLocationError);
}

function onLocationFound(e) {
	console.log ('onLocationFound fires now');

	// build popup display
	PlaceMgr.currentRadius = Math.round(e.accuracy / 2);
	PlaceMgr.currentLocation = e.latlng;
	PlaceMgr.currentLat = e.latlng.lat;
	PlaceMgr.currentLng = e.latlng.lng;
	var downTownDistance = checkHowFar();
	if (downTownDistance > 15){
		PlaceMgr.isTooFar = true;
		onLocationError(e);
		return;
	}

	changeLocations(true);

	// set current location boolean to true for use in reporting the line
	PlaceMgr.isCurrent = true;
	PlaceMgr.isSearchDone = true;

	if (PlaceMgr.isWaiting){
		checkReportLocation();
	}

	if (PlaceMgr.isWaitingSplash){
		$('#splashModal').modal("hide");
	}
}


function onLocationError(e) {
	console.log ('onLocationError fires now');
	PlaceMgr.isSearchDone = true;
	if (PlaceMgr.isWaiting){
		checkReportLocation();
	}

	var messageString2 = "To use the sorting and directions features, we recommend making sure your location services are turned on within your device settings.";

	if (PlaceMgr.isTooFar){
		e.message = "We can't locate you within range of ABQ, so we are redirecting your map to Downtown ABQ. " + messageString2;
	} else {
		e.message = e.message + " We were not able to get your current location. " + messageString2;
	}

	if (PlaceMgr.isWaitingSplash){
		$('#splashModal').modal("hide");
		// notify user
		alert(e.message);
	}

	PlaceMgr.maxDistance = 10;
	// re-set view with Runner Address as base'
	setToHomeAddress();
}


function checkHowFar(){
	// calc distance
	var point1 = {
		"type"      : "Feature",
		"properties": {},
		"geometry"  : {
			"type"       : "Point",
			"coordinates": [PlaceMgr.currentLng, PlaceMgr.currentLat]
		}
	};

	var point2 = {
		"type"      : "Feature",
		"properties": {},
		"geometry"  : {
			"type"       : "Point",
			"coordinates": [PlaceMgr.lng, PlaceMgr.lat]
		}
	};

	var downTownDistance= turf.distance(point1, point2, "miles").toFixed(2);
	console.log('downtown is miles away:');
	console.log(downTownDistance);

	return downTownDistance;

}

function tryAgain(){
	//remove any layers already built
	tearDown();
	// retry
	findCurrentLocation();
}


function changeLocations(isToCurrent){
	console.log ('changeLocations fires now');

	//remove any layers already built
	tearDown();
	map.removeLayer(PlaceMgr.locationsLayer);
	PlaceMgr.locationsLayer = L.layerGroup().addTo(map);


	if (isToCurrent){
		//rebuildHomeIcon(true);
		rebuildCurrentIcon(true);
		setToCurrentLocation();

	} else {
		rebuildHomeIcon(false);
		rebuildCurrentIcon(false);
		setToHomeAddress();
	}
	ga('send', 'event', 'button', 'click', 'changeLocations');
}

function rebuildHomeIcon(isToCurrent){
	console.log ('rebuildHomeIcon fires now');
	if(isToCurrent){
		var theBool = false;
		var theInnerHtml = "Switch to this location as base.";

	} else {
		var theBool = true;
		var theInnerHtml = "Use current location instead";
	}

	var voterLatLong = [PlaceMgr.lat, PlaceMgr.lng];
	//var currentLocationButton;
	//currentLocationButton = "<br/><button class='btn btn-danger btn-xs' id = 'homePopupButton' " +
	//"onClick='changeLocations(" + theBool + ")'>" + theInnerHtml + "</button></div>";

	// build variable for popup display
	var locationDetails2 =	"<div style = 'text-align: center'><strong>Location not enabled <br/>on this device.  " +
		"</strong>";
	//+ currentLocationButton;


	// build html to use in icon
	var homeMarker = "ABQ" +
		"<div class='leaflet-popup-tip-container' style='margin-top: 4px; margin-left: 0px'>" +
		"<div class='leaflet-popup-tip your-location-pointer'></div></div> ";

	var iconAnchor2 = turf.point([PlaceMgr.lng, PlaceMgr.lat]);

	// build custom icon
	myAddressIcon = L.divIcon({
		iconSize   	: [40, 30],
		className  	: "address-icon",
		iconAnchor 	: iconAnchor2,
		popupAnchor	: [0, -35],
		html       	: homeMarker
	});

	// build popup for use in switching
	PlaceMgr.addressPopup = L.popup().setContent(locationDetails2);

	// add icon to map with popup
	L.marker(voterLatLong, {icon: myAddressIcon, title: "Home Address"}).addTo(PlaceMgr.locationsLayer)
		.bindPopup(PlaceMgr.addressPopup);
}


function rebuildCurrentIcon(isToCurrent){
	console.log ('rebuildCurrentIcon fires now');

	if(isToCurrent){
		var theBool = false;
		var theInnerHtml = "Switch your location to downtown ABQ.";

	} else {
		var theBool = true;
		var theInnerHtml = "Switch to this location as base.";
	}

	var locationDetails ="<div style = 'text-align: center'><strong>We think you are within <br/> " + PlaceMgr.currentRadius +
		" meters of this point. </strong><br/>" +
		//"<button class='btn btn-warning btn-xs' id = 'currentPopupButton' onClick='changeLocations(" + theBool + ")'>" + theInnerHtml + "</button>" +
		"</div>";

	// build html to use in icon
	var currentLocationMarker = "You!" +
		"<div class='leaflet-popup-tip-container' style='margin-top: 0px; margin-left: -5px'>" +
		"<div class='leaflet-popup-tip your-location-pointer'></div></div> ";

	var iconAnchor = turf.point([PlaceMgr.currentLocation[1], PlaceMgr.currentLocation[0]]);

	// build custom icon
	myLocationIcon = L.divIcon({
		iconSize   : [30, 30],
		className  : "your-location-icon",
		iconAnchor : iconAnchor,
		popupAnchor: [0, -35],
		html       : currentLocationMarker
	});

	// fixme might be able to just tear down popup layer and then readd?
	// build popup for use in switching
	PlaceMgr.currentPopup = L.popup().setContent(locationDetails);

	// add icon and range circle to map
	L.marker(PlaceMgr.currentLocation, {icon: myLocationIcon, title: "Current Location"}).addTo(PlaceMgr.locationsLayer)
		.bindPopup(PlaceMgr.currentPopup);

	L.circle(PlaceMgr.currentLocation, PlaceMgr.currentRadius).addTo(PlaceMgr.locationsLayer);
}


// enables bouncing back and forth between locations
function setToCurrentLocation() {
	console.log ('setToCurrentLocation fires now');

	map.setView([PlaceMgr.currentLat, PlaceMgr.currentLng  + PlaceMgr.latlngAdjustment], 11);
	//openPopup(PlaceMgr.currentPopup);
	checkForLocations(PlaceMgr.currentLat, PlaceMgr.currentLng);

	// set up zoom events
	resetZoomEvents();
}

// enables bouncing back and forth between locations
function setToHomeAddress() {
	console.log ('setToHomeAddress fires now');

	map.setView([PlaceMgr.lat, PlaceMgr.lng + PlaceMgr.latlngAdjustment], 11);
	//.openPopup(PlaceMgr.addressPopup);

	checkForLocations(PlaceMgr.lat, PlaceMgr.lng);

	// set up zoom events
	resetZoomEvents();
}


///////////////////////////////////////////////////////////////////////////////////
/*
 * Functions to Build Original List and Map Icons
 *
 *
 *
 */

function checkForLocations(lat, long){
	console.log ('checkForLocations fires now');
	// check if query returned locations.  Then check if all array has already been filled.
	if (PlaceMgr.locations === ""){
		alert("We cannot find any locations near you at this time.");

	} else if (PlaceMgr.all[0] != null) {
		console.log ('not first time set up, within checkForLocations fires now');
		// code to rebuild from pre-made PlaceMgr.all lists to previous list locations
		console.log('rebuilding ALL and ZOOM lists after location change');

		reCalcDistance(lat, long); // for all list
		resetZoomList(); // re-curate zoom list from new All List to update distances.
		rebuildAll();


	} else {
		// set up for first time:
		console.log ('set up for first time: fires now inside Check For locations');

		// build all array and zoomList array from scratch using all locations from DB
		buildAllArrayWithDistance(lat, long);

		sortArray('default');

		// set up initial page
		buildIconsAndLists("insertMapListHere");


		// set combined template into live div and reset template
		buildCombinedView();

		PlaceMgr.isFirstBuild = false;


		// show splash modal
		$('#splashModal').modal('show');

	}
}

// reCalcDistance of all locations in case of base location change
function reCalcDistance(lat, long) {
	console.log ('reCalcDistance fires now');

	array = PlaceMgr.all;
	// loop through all locations
	for (var x = 0; x < array.length; x ++) {

		// calc distance
		var point1 = {
			"type"      : "Feature",
			"properties": {},
			"geometry"  : {
				"type"       : "Point",
				"coordinates": [long, lat]
			}
		};

		var point2 = {
			"type"      : "Feature",
			"properties": {},
			"geometry"  : {
				"type"       : "Point",
				"coordinates": [array[x].lon, array[x].lat]
			}
		};

		array[x].Distance = turf.distance(point1, point2, "miles").toFixed(2);
	}

	console.log('PlaceMgr.all after change locations');
	console.log(PlaceMgr.all);
}

// build all array and calc Distance.  initially sorted by lowest lineCount.
function buildAllArrayWithDistance(lat, long) {
	console.log ('buildAllArrayWithDistance fires now');
	console.log ('PlaceMgr.locations list is ');
	console.log (PlaceMgr.locations);

	// loop through all locations
	for( x in PlaceMgr.locations) {
		// calc distance
		var point1 = 	{
			"type": "Feature",
			"properties": {},
			"geometry": {
				"type": "Point",
				"coordinates": [long, lat]
			}
		};

		var point2 = 	{
			"type": "Feature",
			"properties": {},
			"geometry": {
				"type": "Point",
				"coordinates": [PlaceMgr.locations[x].lon, PlaceMgr.locations[x].lat]
			}
		};

		PlaceMgr.locations[x]["Distance"] = turf.distance(point1, point2, "miles").toFixed(2);

		// add all locations to allList
		PlaceMgr.all.push(PlaceMgr.locations[x]);
		//PlaceMgr.all["id"+PlaceMgr.locations[x].OBJECTID] = PlaceMgr.locations[x];


		// check if location is within the map view and add to zoom list
		if(map.getBounds().contains( [Number(PlaceMgr.locations[x].lat) - PlaceMgr.adjustBounds, Number(PlaceMgr.locations[x].lon)] ) ||
			map.getBounds().contains( [Number(PlaceMgr.locations[x].lat) -+PlaceMgr.adjustBounds, Number(PlaceMgr.locations[x].lon)] ) ||
			map.getBounds().contains( [Number(PlaceMgr.locations[x].lat), Number(PlaceMgr.locations[x].lon) - PlaceMgr.adjustBounds] ) ||
			map.getBounds().contains( [Number(PlaceMgr.locations[x].lat), Number(PlaceMgr.locations[x].lon) + PlaceMgr.adjustBounds] ) ){
						// only add items in view to zoomList
			PlaceMgr.zoomList.push(PlaceMgr.locations[x]);
		}
	}

	console.log("zoomList on load is ");
	console.log(PlaceMgr.zoomList);

	console.log("allList on load is ");
	console.log(PlaceMgr.all);
}

// apply color code to each location based on nearest
function buildHeatMap(){
	console.log ('buildHeatMap fires now');

	// collect Distances to build heat map
	var distances = [];
	var withinDistances = [];
	var theLocationId;
	for (things=0; things< PlaceMgr.all.length; things++) {
		theLocationId = "id" + PlaceMgr.all[things].UniqueID;
		if(checkMaxWait(theLocationId) && checkMaxDistance(theLocationId) && checkEarlyVoting(theLocationId) && checkEarly(theLocationId) && checkAbsentee(theLocationId)) {
			distances.push(PlaceMgr.all[things].Distance);
			withinDistances.push(theLocationId);
		}
	}

	var max = Math.max.apply(Math, distances);
	var min = Math.min.apply(Math, distances);
	var totalIncrements = 20;
	var increment = (max-min)/(totalIncrements-1);
	var theId;
	var theDistance;

	for (things = 0; things < withinDistances.length; things++) {
		theId = withinDistances[things];
		theDistance = PlaceMgr.locations[theId].Distance;
		PlaceMgr.heat[theId] = Math.round((theDistance-min+(increment/2))/increment);
	}

	return withinDistances;
}

///////////////////////////////////////////////////////////////////////////////////
/*
 * Functions that Build Stuff
 *
 *
 *
 */

// build all list and icons from scratch using all arrays.
function buildIconsAndLists(listLocationAll){
	console.log ('buildIconsAndLists fires now');
	// build all list and icons
	if (PlaceMgr.all[0] != null) {
		// rebuild all icons
		build(null, "isAll");
		// rebuild zoom List
		build(listLocationAll, "isZoomList");
	}
}

// JKH - todo - genericize this function?
// checks against maxWait, then builds both icons and locations for all groupings depending on boolean
function build(listLocation, whichArray){
	console.log ('build fires now');
	console.log ("whichArray is " + whichArray);
	// set variables
	var array = [];
	var counta;
	var count;
	var counter;
	var theLocationId;

	// build only "all" icons
	if (whichArray === "isAll") {
		console.log ('build the allList should fire now');

		//rebuild heat map array and underMaxWait array out of all array
		var underMaxWait = buildHeatMap();
		console.log (underMaxWait);

		// rebuild icon and buffer for each item underMaxWait array
		for(count = 0; count < underMaxWait.length; count++) {
			theLocationId = underMaxWait[count];
			buildIcon(theLocationId);
		}

		// if undefined, build zoom list only (no icons)
	} else if (whichArray === "isZoomList") {
		array = PlaceMgr.zoomList;
		counta = 1;
		// rebuild list for given array
		for(count = 0; count < array.length; count++) {
			theLocationId = "id" + array[count].UniqueID;
			if(checkMaxWait(theLocationId) && checkMaxDistance(theLocationId) && checkEarlyVoting(theLocationId) && checkEarly(theLocationId) && checkAbsentee(theLocationId)) {
				//rebuild zoom List
				counter = count + counta;
				buildListItem(	theLocationId,
					listLocation,
					counter,
					false);
			}
		}
	}
}


// plot a single location icon and buffer zone
function buildIcon(theId) {
	//console.log ('buildIcon fires now');

	// set variables needed for icons
	var theLocation = PlaceMgr.locations[theId];
	var lineCountGlyphString;
	var iconType;
	var iconClass;
	var iconId;
	var iconSize;
	var theLayer;
	var lineCountMarker;
	var locationPoint;
	var anchor;
	var popupAnchor;

	/* todo fixme: may activate and build on this for hiding/showing icons if performance becomes an issue
	 var classType1 ="";
	 var classType2 ="";
	 var classType3 ="";
	 if (PlaceMgr.locations[theId].isAbsenteeVoting === "y"){
	 classType1 = "absenteeLocation";
	 }

	 if (PlaceMgr.locations[theId].isEarlyVoting === "y"){
	 classType2 = "earlyLocation";
	 }

	 if (PlaceMgr.locations[theId].isAbsenteeVoting !== "y" && PlaceMgr.locations[theId].isEarlyVoting !== "y"){
	 classType3 = "allLocations";
	 }

	 iconClass = classType1 + classType2 + classType3 + 'location-icon heatmap-' + PlaceMgr.heat[theId];
	 */

	// set generic variables
	iconId = 'locationIcon-' + theId;
	theLayer = PlaceMgr.allIconsLayer;
	// build latlong point
	locationPoint = turf.point([theLocation.lon, theLocation.lat]);
	// build point at top of the circle to use for the delivery area marker and icon
	anchor = turf.destination(locationPoint, 0, 0, 'miles');

	// set icon Class and build icons depending on if it's early voting today and the location is eligible for early voting
	if(theLocation.lineCount === 300000) {
	//if(PlaceMgr.isTodayEarlyVoting && theLocation.isEarlyVoting === "n") {
		iconClass = 'grey-icon';
		//iconClass = 'location-icon heatmap-' + PlaceMgr.heat[theId];

		lineCountGlyphString = "";

		// build html to use in icon
		lineCountMarker = 	lineCountGlyphString;
		//"<div class='leaflet-popup-tip-container' style='margin-top: -0.6px'>" +
		//"<div class='leaflet-popup-tip location-pointer'></div></div> ";
		popupAnchor = [-5, -5];
		iconSize = [12, 12];

	} else {

		if (theLocation.lineCount === 200000) {
			iconClass = 'location-icon grey-icon-active';
		} else {
			iconClass = 'location-icon heatmap-' + PlaceMgr.heat[theId];
		}

		lineCountGlyphString = PlaceMgr.locations[theId].lineCountGlyph;

		// build html to use in icon
		lineCountMarker = 	lineCountGlyphString +
									"<div class='leaflet-popup-tip-container' style='margin-top: -1.6px; margin-left: -3px'>" +
									"<div class='leaflet-popup-tip location-pointer'></div></div> ";
		popupAnchor = [-3, -28];
		iconSize = [35, 20];


	}

	buildIconType(theId, iconId, theLayer, anchor, iconClass, lineCountMarker, iconSize, popupAnchor);
}

function buildIconType(theId, iconId, theLayer, anchor, iconClass, lineCountMarker, iconSize, popupAnchor) {

	// build custom icon
	locationIcon = L.extendedDivIcon({
		iconSize   	: iconSize,
		className  	: iconClass,
		iconAnchor 	: anchor,
		popupAnchor	: popupAnchor,
		html       	: lineCountMarker,
		id				: iconId

	});

	// build LocationDetails template using correct location id
	editLocationDetails (theId, false);

	// set variable for location detail display
	var locationBodyDetails = document.getElementById("locationBodyDetails").innerHTML;

	// load icon to geojson layer with anchor as the underlying point
	var locationMarker = L.geoJson(anchor, {
		pointToLayer: function(feature, latlng) {
			return L.marker(latlng, {icon: locationIcon, riseOnHover: true});
		}
	}).bindPopup(locationBodyDetails);

	theLayer.addLayer(locationMarker);
}


function buildListItem(theId, listLocation, counter){
	//console.log ('buildListItem fires now');

	var cssId = "collapse" + counter;
	var href = "#" + cssId;

	// build time string
	var lineCountGlyphString = PlaceMgr.locations[theId].lineCountGlyph;

	// set href and lineCount in buildList template
	document.getElementById("cssId").				setAttribute("id", cssId);
	document.getElementById("insert-list-panel-id").setAttribute("onmouseover", "highlightIcon(\'" + theId + "\');");
	document.getElementById("insert-list-panel-id").setAttribute("onmouseout", "unHighlight(\'" + theId + "\');");
	document.getElementById("insert-list-panel-id").setAttribute("id", "list-panel-"+theId);
	document.getElementById("list-href").			setAttribute("href", href);
	document.getElementById("list-lineCount").		innerHTML = lineCountGlyphString;

	// pass isList boolean = true with location description to edit location details using template
	editLocationDetails (theId, true);

	var theList = document.getElementById(listLocation).innerHTML;

	// add each buildList div to insertListHere div
	document.getElementById(listLocation).innerHTML = theList + document.getElementById("buildList").innerHTML;

	// reset ids for each of template template cssId, and list item panel
	resetBuildListTemplate(theId, counter)
}



///////////////////////////////////////////////////////////////////////////////////
/*
 * Rebuild Functions
 *
 *
 *
 */

function rebuildAll() {
	console.log ('rebuildAll fires now');
	// remove all layers and reset
	tearDown();
	document.getElementById("mapListLive").innerHTML = "";
	buildIconsAndLists("mapListLive");
}

function tearDown(){
	console.log ('tearDown fires now');
	// remove layers
	map.removeLayer(PlaceMgr.allIconsLayer);

	// reset layers
	PlaceMgr.allIconsLayer = L.layerGroup().addTo(map);
}

function rebuildList(){
	console.log('rebuildList fires now');
	document.getElementById("mapListLive").innerHTML = "";
	build("mapListLive", "isZoomList");
}

// JKH - todo - determine which file these functions belong in
///////////////////////////////////////////////////////////////////////////////////
/*
 * Helper and Highlight Functions
 *
 *
 *
 */

// edit location details of hidden template for  popup display
function editLocationDetails (theId, isList) {

	// determine with location details are going in the list items or the icon popups
	if (isList){
		var listName = "list-";
	} else {
		var listName = "";
	}

	//if(PlaceMgr.datasource=="UNM")
	//{
	//	// get google maps link to find directions
	//	var addressLink = "https://www.google.com/maps/dir/Current+Location/" + PlaceMgr.locations[theId].Address.replace(/ /g, '+');
	//
	//
	//
	//	// inject them into the appropriate html stubs
	//	document.getElementById(listName + "addressLink").			setAttribute('href', addressLink);
	//	document.getElementById(listName + "address").				innerHTML = PlaceMgr.locations[theId].Address;
	//	document.getElementById(listName + "name").					innerHTML = PlaceMgr.locations[theId].MVCName;
	//	document.getElementById(listName + "distance").				innerHTML = PlaceMgr.locations[theId].Distance;
	//
	//	document.getElementById(listName + "voting-type").			innerHTML = PlaceMgr.locations[theId].Voting;
	//	document.getElementById(listName + "electionDayTime").		innerHTML = PlaceMgr.locations[theId].ElectionDayTime;
	//	document.getElementById(listName + "openDate").				innerHTML = PlaceMgr.locations[theId].OpenDate;
	//
	//
	//}
	//else
	//{
		// set URL prefix so maps open in the native app if on an iOS or Android device
		var userAgent = navigator.userAgent || navigator.vendor || window.opera;
		var urlprefix = 'https';
		if( userAgent.match( /iPad/i ) || userAgent.match( /iPhone/i ) || userAgent.match( /iPod/i ) )
			urlprefix = 'comgooglemapsurl';
		else if( userAgent.match( /Android/i ) )
			urlprefix = 'maps';
		

		// get google maps link to find directions
		var addressLink = urlprefix + "://www.google.com/maps/dir/Current+Location/" + PlaceMgr.locations[theId].address.replace(/ /g, '+');


		// inject them into the appropriate html stubs
		document.getElementById(listName + "addressLink").			setAttribute('href', addressLink);
		document.getElementById(listName + "address").				innerHTML = PlaceMgr.locations[theId].address;
		document.getElementById(listName + "lineLength").			innerHTML = PlaceMgr.locations[theId].countString;
		document.getElementById(listName + "lastUpdate").			innerHTML = PlaceMgr.locations[theId].hoursSince;
		document.getElementById(listName + "name").					innerHTML = PlaceMgr.locations[theId].name;
		document.getElementById(listName + "distance").				innerHTML = PlaceMgr.locations[theId].Distance;

		// voting type strings:
		var earlyTitle = "";
		var votingEarly = "";
		var votingAbsentee = "";
		var votingElection = "";

		var dayCount = 0;
		if(PlaceMgr.locations[theId].isElectionDay=="y") {
			votingElection = "<br/><span class ='hoursInfo'>Election Day: </span>"
			+ "<br/>Tuesday, October 6th <br/>"
			+ PlaceMgr.locations[theId].electionDayStartTimeStr + " - " + PlaceMgr.locations[theId].electionDayEndTimeStr + "<br/>";
		} else {
			votingElection = "<br/><span class ='hoursInfo'>Election Day: </span>"
			+ "<br/>Closed <br/>";
		}

		if(PlaceMgr.locations[theId].isEarlyVoting=="y") {
			votingDays = "<br>Days: ";
			if(PlaceMgr.locations[theId].isEarlyVotingMonday == "y") {
				votingDays = votingDays + "M ";
				dayCount++;
			}
			if(PlaceMgr.locations[theId].isEarlyVotingTuesday == "y") {
				votingDays = votingDays + "Tu ";
				dayCount++;
			}
			if(PlaceMgr.locations[theId].isEarlyVotingWednesday == "y") {
				votingDays = votingDays + "W ";
				dayCount++;
			}
			if(PlaceMgr.locations[theId].isEarlyVotingThursday == "y") {
				votingDays = votingDays + "Th ";
				dayCount++;
			}
			if(PlaceMgr.locations[theId].isEarlyVotingFriday == "y") {
				votingDays = votingDays + "F";
				dayCount++;
			}

			if(dayCount === 5) {
				votingDays = "Mon - Fri";
			}

			earlyTitle = "<span class ='hoursInfo'>Early Voting:</span><br/>";
			//+ votingDays + "<br/>"
			//+ PlaceMgr.locations[theId].earlyVotingDayStartTime + " - " + PlaceMgr.locations[theId].earlyVotingDayEndTime + "<br/>"
			//+ PlaceMgr.locations[theId].earlyVotingStartDateStr + " - " + PlaceMgr.locations[theId].earlyVotingEndDateStr;

			votingEarly = earlyTitle
			+ votingDays + "<br/>"
			+ PlaceMgr.locations[theId].earlyVotingDayStartTimeStr + " - " + PlaceMgr.locations[theId].earlyVotingDayEndTimeStr + "<br/>"
			+ PlaceMgr.locations[theId].earlyVotingStartDateStr + " - " + PlaceMgr.locations[theId].earlyVotingEndDateStr + "<br/>";
		}

		// Fixme: deprecated as Absentee season already closed as of this writing.  Turn back on for future version.
		//if(PlaceMgr.locations[theId].isAbsenteeVoting == "y") {
		//	votingAbsentee = "<span class ='hoursInfo'>Absentee Dropoff:</span><br/>"
		//		+ votingDays + "<br/>"
		//		+ PlaceMgr.locations[theId].absenteeVotingStartTimeStr + " - " + PlaceMgr.locations[theId].absenteeVotingEndTimeStr + "<br/>"
		//		+ PlaceMgr.locations[theId].absenteeVotingStartDateStr + " - " + PlaceMgr.locations[theId].absenteeVotingEndDateStr + "<br/>";
		//}

		document.getElementById(listName + "voting-early").		innerHTML = votingEarly;
		document.getElementById(listName + "voting-absentee").	innerHTML = votingAbsentee;
		document.getElementById(listName + "voting-election").	innerHTML = votingElection;
	//}
}

// check if meets max wait time criteria set by user
function checkMaxWait(theId){
	// check if max wait checkbox is checked "on" and if so, check if meets the criteria
	if (!document.getElementById('isMaxWait').checked
		|| PlaceMgr.locations[theId].lineCount <= PlaceMgr.maxWait) {
		return true;
	}
}

// check if meets max distance criteria set by user
function checkMaxDistance(theId){
	// check if max wait checkbox is checked "on" and if so, check if meets the criteria
	if (!document.getElementById('isMaxDistance').checked
		|| PlaceMgr.locations[theId].Distance <= PlaceMgr.maxDistance) {
		return true;
	}
}

// check if it's early voting
function checkEarly(theId){
	var element;
	if (PlaceMgr.isFirstBuild){
		element = "earlyBox";
	} else {
		element = "earlyBoxLive"
	}
	// check if show early only checkbox is checked "on" and if so, check if meets the criteria
	if (!document.getElementById(element).checked
		|| PlaceMgr.locations[theId].isEarlyVoting == "y") {
		return true;
	}
}

// check if it's part of all list -- currently deprecated because if it's not open on election day (clerk's office) then it's given a 200000 code in assignLineCount
function checkIfAll(theId){
	var element;
	if (PlaceMgr.isFirstBuild){
		element = "allBox";
	} else {
		element = "allBoxLive"
	}
	// check if show all checkbox is checked "on" and if so, check if meets the criteria
	if (!document.getElementById(element).checked
		|| PlaceMgr.locations[theId].isElectionDay == "y") {
		return true;
	}
}

// check if it's absentee voting
function checkAbsentee(theId){
	var element;
	if (PlaceMgr.isFirstBuild){
		element = "absenteeBox";
	} else {
		element = "absenteeBoxLive"
	}

	// check if max wait checkbox is checked "on" and if so, check if meets the criteria
	if (!document.getElementById(element).checked
		|| PlaceMgr.locations[theId].isAbsenteeVoting == "y") {
		return true;
	}
}



// check if meets early voting criteria set by user
function checkEarlyVoting(theId){
	var earlyCheck = true;
	// check if early voting is open on the user specified date, based on day of week and start/end dates
	if(PlaceMgr.locations[theId].isEarlyVoting != undefined)
	{
		// create date variables for early voting start and end
		var earlyStart = new Date(PlaceMgr.locations[theId].earlyVotingStartDate);
		var earlyEnd = new Date(PlaceMgr.locations[theId].earlyVotingEndDate);

		// check if early voting is allowed at this location
		if(PlaceMgr.locations[theId].isEarlyVoting != 'y')
			earlyCheck = false;
		// check if date is before early voting start date
		else if(new Date(PlaceMgr.earlyVotingDate) < earlyStart)
			earlyCheck = false;
		// check if date is past early voting end date
		else if(new Date(PlaceMgr.earlyVotingDate) > earlyEnd)
			earlyCheck = false;
		else
		{
			var earlyDay = new Date(PlaceMgr.earlyVotingDate).getDay();
			// check if location is open on that day of the week
			if(earlyDay == 1 && PlaceMgr.locations[theId].isEarlyVotingMonday != 'y')
				earlyCheck = false;
			else if(earlyDay == 2 && PlaceMgr.locations[theId].isEarlyVotingTuesday != 'y')
				earlyCheck = false;
			else if(earlyDay == 3 && PlaceMgr.locations[theId].isEarlyVotingWednesday != 'y')
				earlyCheck = false;
			else if(earlyDay == 4 && PlaceMgr.locations[theId].isEarlyVotingThursday != 'y')
				earlyCheck = false;
			else if(earlyDay == 5 && PlaceMgr.locations[theId].isEarlyVotingFriday != 'y')
				earlyCheck = false;
			else if(earlyDay == 6 || earlyDay == 0)
				earlyCheck = false;
		}
	}
	// check if early voting checkbox is checked "on" and if so, check if meets the criteria
	if (!document.getElementById('isEarlyVoting').checked
		|| earlyCheck==true) {
		return true;
	}
}


// JKH - generic helper functions (windows file)
function resetBuildListTemplate(id, counter){
	//console.log ('resetBuildListTemplate fires now');
	document.getElementById("list-panel-" + id).setAttribute("id", "insert-list-panel-id");
	document.getElementById("collapse" + counter).setAttribute('id', 'cssId');
}


// highlight on mouseover
function highlightIcon(theId){
	//console.log ('highlightIcon fires now');
	if(!!document.getElementById("locationIcon-" + theId)) {
		document.getElementById("locationIcon-" + theId).style.background = "yellow";
		document.getElementById("locationIcon-" + theId).style.color = "black";
		document.getElementById("locationIcon-" + theId).style.zIndex = 100000;
	}
}

// unhighlight on mouseout
function unHighlight(theId) {
	//console.log ('unHighlight fires now');
	if(!!document.getElementById("locationIcon-" + theId)) {
		document.getElementById("locationIcon-" + theId).style.background = "";
		document.getElementById("locationIcon-" + theId).style.color = "";
		document.getElementById("locationIcon-" + theId).style.zIndex = "";
	}
}

///////////////////////////////////////////////////////////////////////////////////
/*
 * All view-toggling functions
 *
 *
 *
 */

function decideView(message) {
	console.log('decideView fires now');

	//document.getElementById("isListView").value = "list-off";
	console.log(message);
	// check source:
	if(message === "map-on") {
		console.log('Starting map-on');
		console.log(message);

		//...then map only box was turned on.  First reset the map checkbox value.
		document.getElementById("mapViewId").value = "map-off";

		// then hide the list div regardless of view it contains to show map-only view.
		document.getElementById("listGoesHere").style.display = "none";

		// set current map div to 100% width and reload tiles
		document.getElementById("mapGoesHere").style.width = "100%";
		map.invalidateSize();

		console.log('Map on works');

	} else if(message === "map-off") {
		console.log('Starting map-off');
		//...then map only box was turned off.  First reset the map checkbox value.
		document.getElementById("mapViewId").value = "map-on";

		// Unhide listGoesHere div....
		document.getElementById("listGoesHere").style.display = "inline";

		// remove 100% width from inline and reload tiles
		if (document.getElementById("mapGoesHere").style.removeProperty) {
			document.getElementById("mapGoesHere").style.removeProperty('width');
		} else {
			document.getElementById("mapGoesHere").style.removeAttribute('width');
		}
		map.invalidateSize();

		console.log('Map-off worked');
	}
}

PlaceMgr.listCount = 0;

function buildCombinedView(){
	console.log ('buildCombinedView fires now');

	// add new id's to soon-to-be-live list
	document.getElementById("insertMapListHere").				setAttribute('id', 'mapListLive');

	// add new ids to tabs and sort buttons
	//document.getElementById("zoomTabLink").					setAttribute('href', '#liveZoomTab');
	//document.getElementById("zoomTabLink").					setAttribute('aria-controls', 'liveZoomTab');
	document.getElementById("zoomTabLink").					setAttribute('id', 'liveZoomLink');
	document.getElementById("zoomPane").						setAttribute('id', 'liveZoomTab');

	document.getElementById("byLowest").						setAttribute('id', 'byLowestLive');
	document.getElementById("byNearest").						setAttribute('id', 'byNearestLive');
	document.getElementById("byName").							setAttribute('id', 'byNameLive');

	document.getElementById("lowestCaret").					setAttribute('id', 'lowestCaretLive');
	document.getElementById("nearestCaret").					setAttribute('id', 'nearestCaretLive');
	document.getElementById("nameCaret").						setAttribute('id', 'nameCaretLive');

	// add new ids to scrollable list for hiding
	document.getElementById("listRow").							setAttribute('id', 'liveListRow');

	// set filter in list id's
	document.getElementById("allBox").							setAttribute('id', 'allBoxLive');
	document.getElementById("earlyBox").						setAttribute('id', 'earlyBoxLive');
	document.getElementById("absenteeBox").					setAttribute('id', 'absenteeBoxLive');

	// assign class to scrollabeList wrapper, then change id -> used to be able to make it vertically responsive
	document.getElementById("scrollableList").				className = "listWrapperLive";
	document.getElementById("scrollableList").				setAttribute('id', 'liveScrollableList');
	document.getElementById("scrollableList2").				setAttribute('id', 'liveScrollableList2');
	document.getElementById("subtractFromList1").				setAttribute('id', 'subtractFromList1Live');
	//document.getElementById("subtractFromList2").				setAttribute('id', 'subtractFromList2Live');


	// set list live by putting it into the list div and identifying it with new value string
	//console.log("innerHTML being added");
	//console.log(document.getElementById("buildListInMap").innerHTML);
	PlaceMgr.listCount ++;
	console.log('LIST COUNT INFO');
	console.log(PlaceMgr.listCount);
	document.getElementById("listGoesHere").					innerHTML = document.getElementById("buildListInMap").innerHTML;

	// reset template html and id's
	document.getElementById('mapListLive').					innerHTML = "";
	document.getElementById('mapListLive').					setAttribute('id', "insertMapListHere");

	// reset hrefs and links on template
	// document.getElementById("liveZoomLink").					setAttribute('href', '');
	// document.getElementById("liveZoomLink").					setAttribute('aria-controls', '');
	document.getElementById("liveZoomLink").					setAttribute('id', 'zoomTabLink');
	document.getElementById("liveZoomTab").					setAttribute('id', 'zoomPane');

	document.getElementById("byLowestLive").					setAttribute('id', 'byLowest');
	document.getElementById("byNearestLive").					setAttribute('id', 'byNearest');
	document.getElementById("byNameLive").						setAttribute('id', 'byName');


	document.getElementById("lowestCaretLive").						setAttribute('id', 'lowestCaret');
	document.getElementById("nearestCaretLive").						setAttribute('id', 'nearestCaret');
	document.getElementById("nameCaretLive").							setAttribute('id', 'nameCaret');


	// reset scrollable list
	document.getElementById("liveScrollableList").			setAttribute('id', 'scrollableList');
	document.getElementById("liveScrollableList2").			setAttribute('id', 'scrollableList2');
	document.getElementById("subtractFromList1Live").				setAttribute('id', 'subtractFromList1');
	//document.getElementById("subtractFromList2Live").				setAttribute('id', 'subtractFromList2');

	document.getElementById("liveListRow").							setAttribute('id', 'listRow');

	// reset list filter id's
	document.getElementById("allBoxLive").							setAttribute('id', 'allBox');
	document.getElementById("earlyBoxLive").						setAttribute('id', 'earlyBox');
	document.getElementById("absenteeBoxLive").					setAttribute('id', 'absenteeBox');

	// UNassign class to template scrollabeList wrapper template so it can be reused
	document.getElementById("scrollableList").className = "";
}

function showMobileMap(){
	console.log ('showMobileMap fires now');
	console.log('mobileMap fired');
	console.log(document.getElementById('scrollableList'));
	document.getElementById('liveScrollableList2').style.display = "none";
	//document.getElementById('liveListRow').style.height = "0%";
	//document.getElementById('liveZoomLink').style.display = "none";
	document.getElementById('mapToggler').style.display = "none";
	document.getElementById('listToggler').style.display = "inline";
	document.getElementById('listDiv').style.height = "0";
}

function hideMobileMap(){
	console.log ('hideMobileMap fires now');
	document.getElementById('liveScrollableList2').style.display = "block";
	//document.getElementById('liveListRow').style.display = "block";
	//document.getElementById('liveZoomLink').style.display = "block";
	document.getElementById('mapToggler').style.display = "inline";
	document.getElementById('listToggler').style.display = "none";
	document.getElementById('listDiv').style.height = "100%";
}

///////////////////////////////////////////////////////////////////////////////////
/*
 * Zone Filter-related Functions
 *
 *
 *
 */

function resetZoomEvents() {
	map.on("moveend", resetZoomList);
	map.on("zoomend", resetZoomList);
	map.on("rezize", resetZoomList);
}

function resetZoomList () {
	console.log ('resetZoomList fires now');
	PlaceMgr.zoomList = [];
	for (var x = 0; x < PlaceMgr.all.length; x++) {
		if(map.getBounds().contains( [Number(PlaceMgr.all[x].lat) - PlaceMgr.adjustBounds, Number(PlaceMgr.all[x].lon)] ) ||
			map.getBounds().contains( [Number(PlaceMgr.all[x].lat) + PlaceMgr.adjustBounds, Number(PlaceMgr.all[x].lon)] ) ||
			map.getBounds().contains( [Number(PlaceMgr.all[x].lat), Number(PlaceMgr.all[x].lon) + PlaceMgr.adjustBounds] ) ||
			map.getBounds().contains( [Number(PlaceMgr.all[x].lat), Number(PlaceMgr.all[x].lon) - PlaceMgr.adjustBounds] ) ){
			PlaceMgr.zoomList.push(PlaceMgr.all[x]);
		}
	}
	console.log ('resetZoomList is done:');
	console.log (PlaceMgr.zoomList);

	sortArray(PlaceMgr.isSortByType);
	rebuildList();
}

///////////////////////////////////////////////////////////////////////////////////
/*
 * Miscellaneous functions
 *
 *
 */
// get values of URL parameters
function getQueryVariable(variable)
{
	var query = window.location.search.substring(1);
	var vars = query.split("&");
	for (var i=0;i<vars.length;i++) {
		var pair = vars[i].split("=");
		if(pair[0] == variable){return pair[1];}
	}
	return(false);
}

// NOTE: these window functions must remain in this file
// function to get height of list div and scrollable list
$(window).resize(function () {
	// first get current listDiv height and display
	var listDiv = $('#listDiv');
	var listDivHeight = listDiv.outerHeight();
	var listDivDisplay = listDiv.css('display');

	// then make sure list div is set to 100% height
	listDiv.css({ "height": "100%" });

	// then calc scrollable list height
	var tabsHeight = $('#subtractFromList1Live').outerHeight();
	//var filterButtonHeight = $('#subtractFromList2Live').outerHeight();
	var wrapperHeight = $('.listWrapperLive').outerHeight();
	var height = wrapperHeight - tabsHeight + 1;
	console.log(wrapperHeight + "-" + tabsHeight + "=" + height);

	$('.scrollable-height').css({ "height": height + "px" });

	// reset ListDiv height and display
	listDiv.css({ "height": listDivHeight });
	listDiv.css({ "display": listDivDisplay });

});

//// function to get height of list div to
$(window).ready(function () {
	var tabsHeight = $('#subtractFromList1Live').outerHeight();
	//var filterButtonHeight = $('#subtractFromList2Live').outerHeight();
	var wrapperHeight = $('.listWrapperLive').outerHeight();
	PlaceMgr.listHeight = wrapperHeight - tabsHeight + 1;
	console.log(wrapperHeight + "-" + tabsHeight + "=" + PlaceMgr.listHeight);
	$('.scrollable-height').css({ "height": PlaceMgr.listHeight + "px" });


	// if mobile display, show map as default view
	var w = window.innerWidth
		|| document.documentElement.clientWidth
		|| document.body.clientWidth;
	if (w < 768)
		showMobileMap();
});
