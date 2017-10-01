tempmauth={}

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

function updateStatus(mAlive,sAlive,mLastCall,sLastCall){
  mauth.mobile.available = mAlive;
  mauth.server.available = sAlive;
  mauth.mobile.lastCall = mLastCall || mauth.mobile.lastCall;
  mauth.server.lastCall = sLastCall || mauth.server.lastCall;
}

function handlerIsConnectedCallback(callback,tab,status,responseText){
mauth.isConnectedUrl = mauth.pluginUrlDefault + "/isconnected";

  console.log("The call returned from handlerIsConnectedCallback",callback,tab,status,responseText);
  if (status == 404){
    page.tabs[tab.id].errorMessage  = error.ServerNotReachable;
    updateStatus(false,false,new Date(),new Date());
      callback({
        identifier:qr.uid,
        isMobileAvailable:false,
        isServerAvailable : false,
        associated : false,
        error : page.tabs[tab.id].errorMessage});
      return ;
  }

  console.log ( "The value of the tabs is",tab);
  if ( status == 200) {
    if ( !responseText["deviceAlive"]){

      // page.tabs[tab.id].errorMessage = error.MobileNotConnected;
      page.tabs[tab.id].errorMessage ="Unable to Connect to mobile";
    }
      updateStatus(true,true,responseText["lastTimeDeviceSync"],new Date());
      callback({
        identifier:qr.uid,
        isMobileAvailable: responseText["deviceAlive"],
        isServerAvailable : true,
        associated :false,
        error : page.tabs[tab.id].errorMessage
      });
      return;
  }

  page.tabs[tab.id].errorMessage = error.UnknownErrorInConnection;
  updateStatus(false,false,null,null);
  callback({
    identifier:qr.uid,
    isMobileAvailable:false,
    isServerAvailable:false,
    associated:false,
    error:page.tabs[tab.id].errorMessage
  });

return ;

}

mauth.isConnected = function(callback,tab,uid){

    var CheckConnectionRequest = {
      "uid" :uid,
      "deviceType" : "browser",
      "ping" :  "mobile"
    };

    if ( qr.uid == uid)
      if(  getTimeInSeconds(new Date(), mauth.server.lastCall) < mauth.waitingTimeIntervalInSeconds  )
        return mauth.isAssociated();

    network.sendAsync(handlerIsConnectedCallback,callback,tab,mauth.isConnectedUrl,CheckConnectionRequest);
}

mauth.testAssociationAsync = function ( callback, tab, triggerUnlock) {

  console.log("The test Association of called !! Let's see how it goes");
  page.tabs[tab.id].errorMessage = error.UnknownErrorInConnection;
  if (qr.uid == null ){

    page.tabs[tab.id].errorMessage = error.QrCodeNotPresent;
    updateStatus(false,false,null,null);
    callback({
      identifier:qr.uid,
      isMobileAvailable:false,
      isServerAvailable:false,
      associated:false,
      error:page.tabs[tab.id].errorMessage
    });
    return ;
  }
  mauth.isConnected(callback,tab,qr.uid);
}


function handlerConnect(callback,tab,status,responseText){


// Fix the working of the return etc for this method

  if ( status == 404 ){
    page.tabs[tab.id].errorMessage = error.ServerNotReachable;
    updateStatus(false,false,new Date(),new Date());
  }
  else if ( status != 200) {
    page.tabs[tab.id].errorMessage = error.UnknownErrorInConnection;
    updateStatus(false,true,new Date(),new Date());
  }
  else if ( status == 200){

    // Uid string `json:"uid"`
    // DeviceType string `json:"deviceType"`
    // UserName string `json:"userName"`
    // MobileAlive bool `json"mobileAlive"`
    // BrowserAlive bool	`json":browserAlive"`
    // LastTimeBrowserSync time.Time `json:"lastTimeBrowserSync"`
    // LastTimeMobileSync	time.Time `json:lastTimeMobileSync`
    // ForcedConnect bool `json:forcedConnect"`

    if ( responseText["mobileAlive"]){
      updateStatus(true,true,responseText["lastTimeMobileSync"],new date());
      page.tabs[tab.id].errorMessage = error.ConnectionEstablished;
    }
    else{
      page.tabs[tab.id].errorMessage = error.MobileNotConnected;
      updateStatus(false,true,null,new Date());
    }
  }

  callback({
    identifier:qr.uid,
    isMauthMobileAvailable:mauth.mobile.available,
    isMauthServerAvailable:mauth.server.available,
    associated: mauth.isAssociated(),
    error: page.tabs[tab.id].errorMessage,
    mobileName:mauth.mobileName
  });

}

mauth.connectUrl = mauth.pluginUrlDefault + "/connect";
mauth.connect = function(callback,tab){

  console.log("The connect function is called");

  var createConnectionRequest = {
    "uid":qr.uid,
    "deviceType":"browser",
    "connectTo":"mobile",
    "forceConnect":false,
  };


  network.sendAsync(handlerConnect,
    callback,
    tab,
    mauth.pluginUrlDefault,
    createConnectionRequest
  );

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
// TODO This has to be modified, later on to accomodate the testing of the mobile connectivity

function getTimeInSeconds(current,old){
  return ( current.getTime() - old.getTime() ) /1000;
}

function handlerServerPing(callback){
    callback();
}
mauth.server.ping = function(callback,uid){
  return true;
}

function handlerMobilePing(callback){
    callback();
}

mauth.mobile.ping = function(callback,uid){
  network.sendAsync(handlerMobilePing,uid);
  return false;
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
    return false;

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



mauth.testAssociationPromise = function(tab,uid){

  return new Promise( function(resolve,reject){

      var checkConnectionRequest = {
        "uid" :uid,
        "deviceType" : "browser",
        "ping" :  "mobile"
      };

      if ( qr.uid == uid)
        if(  getTimeInSeconds(new Date(), mauth.server.lastCall) < mauth.waitingTimeIntervalInSeconds  )
          return mauth.isAssociated();

      var result = network.sendSync(mauth.isConnectedUrl,checkConnectionRequest);

      var status = result[0];
      var response = result[1];

      if ( result ){
        resolve();
      }
      else{
        reject();
      }

  });
}
