mauth={}


mauth.associated = {"value": false, "hash": null};
mauth.lastSync = null;
mauth.lastMakeConnectionCallTimeStamp = null;
mauth.lastMakeConnectionCallStatus = false;
mauth.qrUid=null;
mauth.isEncryptionKeyUnrecognized = false;
mauth.currentMauthHttp = {"version": 0, "versionParsed": 0};
mauth.latestMauthHttp = (typeof(localStorage.latestmauthHttp) == 'undefined') ? {"version": 0, "versionParsed": 0, "lastChecked": null} : JSON.parse(localStorage.latestmauthHttp);
mauth.keySize = 8; // wtf? stupid cryptoHelpers
mauth.pluginUrlDefault = "http://localhost:19455";
mauth.latestVersionUrl = "https://passifox.appspot.com/kph/latest-version.txt";
mauth.cacheTimeout = 30 * 1000; // milliseconds
mauth.keyId = "chromeipass-cryptokey-name";
mauth.keyBody = "chromeipass-key";
mauth.mobile = {  "available": false, "lastCall" : new Date("October 13, 2014 11:13:00") };
mauth.server = { "available":false , "lastCall" : new Date("October 13, 2014 11:13:00") };
mauth.waitingTimeIntervalInSeconds = 4;
mauth.to_s = cryptoHelpers.convertByteArrayToString;
mauth.to_b = cryptoHelpers.convertStringToByteArray;


mauth.isConnectedUrl = mauth.pluginUrlDefault + "/isconnected";
mauth.isConnected = function(uid){
    var connection = {
      "uid" :uid ,
      "msg": "Hello"
    };
    var response =  network.sendSync(mauth.isConnectedUrl,connection);
    return response["msg"] == "Hey";
}

mauth.connectUrl = mauth.pluginUrlDefault + "/connect";
mauth.connect = function(tab){
  var connection = {
    "uid":qr.uid,
    "msg":"connect"
  };
  // based on the response, I can find out if the backend is working and if the mobile is having
  // some issue in it
  mauth.isMobileAvailable = false;
  mauth.isServerAvailable = false;
  var response = network.sendPollSync(url,connection);
  var status = response[0];
  if ( status == 404 ){
    page.tabs[tab.id].errorMessage = "Unable to Connect to Internet";
    mauth.isMobileAvailable = false;
    mauth.isServerAvailable = false;
  }
  else if ( status != 200) {
    page.tabs[tab.id].errorMessage = "Please make sure the phone is unlocked and connected to internet";
    mauth.isMobileAvailable = false;
    mauth.isServerAvailable = true;
  }
  else if ( status == 200){
    page.tabs[tab.id].errorMessage = "Chrome is connected to the mobile phone !!";
    mauth.isMobileAvailable = true;
    mauth.isServerAvailable = true;
    mauth.mobileName = resonse[1];
  }
  return status == 200;
}

mauth.getCredentials = mauth.pluginUrlDefault + "/getcreds";
mauth.getCreds = function ( uid, url ){
      var credsRequest = {
        "uid":uid,
        "url":url
      };
    return network.sendSync(mauth.getCredentials,credsRequest);
}

mauth.availableCreds  = mauth.pluginUrlDefault +"/availablecreds";
mauth.getAvailableCreds = function ( uid ){
  var availableCreds ={
    'uid':uid
  };
  return network.sendSync(mauth.availableCreds,availableCreds);
}

mauth.isAssociated = function(){
  return mauth.isMobileAvailable && mauth.isServerAvailable;
}

mauth.associate = function(callback, tab) {

	if(mauth.isAssociated()) {
		return;
	}
	page.tabs[tab.id].errorMessage = null;
  var qr = generateQRCode();
		browserAction.show(callback, tab);
}


function callRequired(){

}

// TODO This has to be modified, later on to accomodate the testing of the mobile connectivity

function checkConnectivityBackendServer(){
}

function checkConnectivityMobileApp(){
}

function getTimeInSeconds(current,old){
  return ( current.getTime() - old.getTime() ) /1000;
}

mauth.server.ping = function(uid){
  return true;
}
mauth.mobile.ping = function(uid){
  return true;
}

function testAssociation(tab,uid,device,errorMessage) {

  var lastCallInSeconds = getTimeInSeconds(new  Date(),mauth[device].lastCall);
  if (lastCallInSeconds > mauth.waitingTimeIntervalInSeconds){
      var status = mauth[device].ping(uid);
      mauth[device].lastCall = new Date();
      mauth[device].available = status;
      if ( status == false)
        page.tabs[tab.id].errorMessage = errorMessage;
      return status;
  }
    return mauth[device].available;

}


mauth.testAssociation = function (tab, triggerUnlock) {

  console.log("The test Association of called !! Let's see how it goes");
  page.tabs[tab.id].errorMessage = "Unknown Error in the connection !!";

  if (qr.uid == null ){
    page.tabs[tab.id].errorMessage = "Please scan the code through phone !!";
    return false;
  }

  var serverStatus = testAssociation(tab,
    qr.uid,
    "server",
    "Please ensure that you are connected to Internet");

  if ( serverStatus == false )
    return false ;

  return testAssociation(tab,
     qr.uid,
     "mobile",
     "Please ensure that phone is connected to Internet");

}


mauth.retrieveCredentials = function (callback, tab, url, submiturl, forceCallback, triggerUnlock) {

	page.debug("Mauth.retrieveCredentials(callback, {1}, {2}, {3}, {4})", tab.id, url, submiturl, forceCallback);

	page.tabs[tab.id].errorMessage = null;

	// is browser associated to keepass?
	if( !mauth.testAssociation(tab, triggerUnlock) ) {
		browserAction.showDefault(null, tab);
		if(forceCallback) {
			callback([]);
		}
		return;
	}

  var request = {
    "uid":qr.uid,
    "url":url,
    "submitUrl":submiturl
  };

	var result = network.send(request,mauth.getCredentials);
	var status = result[0];
	var response = result[1];
	var entries = [];

	if(mauth.checkStatus(status, tab)) {
		var r = JSON.parse(response);
    console.log("The calling of the retrieveCredentials being called ");
    for ( var i =0 ; i < r.length ; i++){
    }
    entries = r;

    if ( entries.length == 0){
      console.log("The length of the possible credentials that can be inserted is zerpo");
      browserAction.showDefault(null,tab);
    }
	}
	else {
		browserAction.showDefault(null, tab);
	}
	page.debug("keepass.retrieveCredentials() => entries.length = {1}", entries.length);
	callback(entries);
}
mauth.checkStatus = function (status, tab) {
	var success = (status >= 200 && status <= 299);
	mauth.isMobileAvailable = true;
	mauth.isServerAvailable = true;

	if(tab && page.tabs[tab.id]) {
		delete page.tabs[tab.id].errorMessage;
	}

	if (!success) {
		keepass.associated.value = false;
		keepass.associated.hash = null;
		if(tab && page.tabs[tab.id]) {
			page.tabs[tab.id].errorMessage = "Unknown error: " + status;
		}
		console.log("Error: "+ status);

		if (status == 503) {
			keepass.isMauthMobileAvailable = false;
			console.log("Mobile is not connected !! Please try again");
			if(tab && page.tabs[tab.id]) {
				page.tabs[tab.id].errorMessage = "Mobile is not connected.";
			}
		}
		else if (status == 0) {
			keepass.isMauthServerAvailable = false;
			console.log("Could not connect to Server !! Please check the internet connection");
			if(tab && page.tabs[tab.id]) {
				page.tabs[tab.id].errorMessage = "Please check the internet connection";
			}
		}
	}

	page.debug("Mauth.checkStatus({1}, [tabID]) => {2}", status, success);

	return success;
}

mauth.connect = function ( ){
}
