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
mauth.isMauthMobileAvailable = false;
mauth.isMauthServerAvailable = false;
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
mauth.connect = function(uid){
  var connection = {
    "uid":uid,
    "msg":"connect"
  };
  return network.sendPollSync(url,connection);
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
  return mauth.isMauthMobileAvailable && mauth.isMauthServerAvailable;
}

mauth.associate = function(callback, tab) {

	if(mauth.isAssociated()) {
		return;
	}

	page.tabs[tab.id].errorMessage = null;

  var qr = generateQRCode();

	// var rawKey = cryptoHelpers.generateSharedKey(keepass.keySize * 2);
	// var key = keepass.b64e(srawKey);
  //
	// var request = {
	// 	RequestType: "associate",
	// 	Key: key
	// };
  //
	// keepass.setVerifier(request, key);
  //
	// var result = keepass.send(request);
  //
	// if(keepass.checkStatus(result[0], tab)) {
	// 	var r = JSON.parse(result[1]);
  //
	// 	if(r.Version) {
	// 		keepass.currentKeePassHttp = {
	// 			"version": r.Version,
	// 			"versionParsed": parseInt(r.Version.replace(/\./g,""))
	// 		};
	// 	}
  //
	// 	var id = r.Id;
	// 	if(!keepass.verifyResponse(r, key)) {
	// 		page.tabs[tab.id].errorMessage = "KeePass association failed, try again.";
	// 	}
	// 	else {
	// 		keepass.setCryptoKey(id, key);
	// 		keepass.associated.value = true;
	// 		keepass.associated.hash = r.Hash || 0;
	// 	}

		browserAction.show(callback, tab);
}

// TODO This has to be modified, later on to accomodate the testing of the mobile connectivity
mauth.testAssociation = function (tab, triggerUnlock) {
  mauth.isMauthServerAvailable=false;
  mauth.isMauthMobileAvailable=false;

  if ( mauth.isConnected( qr.uid ) ){
    console.log("The call to the connect is made");
    mauth.isMauthServerAvailable=true;
    mauth.isMauthMobileAvailable=true;
    return true;
  }
  page.tabs[tab.id].errorMessage = "Unable to connect to the Internet. Please check you are online";
  return false;
}


mauth.retrieveCredentials = function (callback, tab, url, submiturl, forceCallback, triggerUnlock) {

	page.debug("Mauth.retrieveCredentials(callback, {1}, {2}, {3}, {4})", tab.id, url, submiturl, forceCallback);

	page.tabs[tab.id].errorMessage = null;

	// is browser associated to keepass?
	if(!mauth.testAssociation(tab, triggerUnlock)) {
		browserAction.showDefault(null, tab);
		if(forceCallback) {
			callback([]);
		}
		return;
	}

	// // build request
	// var request = {
	// 	"RequestType": "get-logins",
	// 	"SortSelection": "true",
	// 	"TriggerUnlock": (triggerUnlock === true) ? "true" : "false"
	// };
	// var verifier = keepass.setVerifier(request);
	// var key = verifier[1];
  // var id = verifier[0];
	// var iv = request.Nonce;
	// request.Url = keepass.encrypt(url, key, iv);

	// if(submiturl) {
	// 	request.SubmitUrl = keepass.encrypt(submiturl, key, iv);
	// }

	// send request
  // This can't be encrypted

  var request = {
    "uid":qr.uid,
    "url":url,
    "submitUrl":submiturl
  };

	var result = network.send(request,mauth.getCredentials);
	var status = result[0];
	var response = result[1];
	var entries = [];

	// verify response

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
// The code for the encryption goes here
		// if (keepass.verifyResponse(r, key, id)) {
		// 	var rIv = r.Nonce;
		// 	for (var i = 0; i < r.Entries.length; i++) {
		// 		keepass.decryptEntry(r.Entries[i], key, rIv);
		// 	}
		// 	entries = r.Entries;
		// 	keepass.updateLastUsed(keepass.databaseHash);
		// 	if(entries.length == 0) {
		// 		//questionmark-icon is not triggered, so we have to trigger for the normal symbol
		// 		browserAction.showDefault(null, tab);
		// 	}
		// }
		// else {
		// 	console.log("RetrieveCredentials for " + url + " rejected");
		// }

	}
	else {
		browserAction.showDefault(null, tab);
	}

	page.debug("keepass.retrieveCredentials() => entries.length = {1}", entries.length);
	callback(entries);

}



mauth.checkStatus = function (status, tab) {
	var success = (status >= 200 && status <= 299);
	mauth.isMauthMobileAvailable = true;
	mauth.isMauthServerAvailable = true;

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
