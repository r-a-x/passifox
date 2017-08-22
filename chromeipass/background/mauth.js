mauth={}

mauth.associated = {"value": false, "hash": null};
mauth.qrUid=null;
mauth.isDatabaseClosed = false;
mauth.isMauthHttpAvailable = false;
mauth.isEncryptionKeyUnrecognized = false;
mauth.currentMauthHttp = {"version": 0, "versionParsed": 0};
mauth.latestMauthHttp = (typeof(localStorage.latestmauthHttp) == 'undefined') ? {"version": 0, "versionParsed": 0, "lastChecked": null} : JSON.parse(localStorage.latestmauthHttp);
mauth.keySize = 8; // wtf? stupid cryptoHelpers
mauth.pluginUrlDefault = "http://localhost:19455/";
mauth.latestVersionUrl = "https://passifox.appspot.com/kph/latest-version.txt";
mauth.cacheTimeout = 30 * 1000; // milliseconds
mauth.databaseHash = "no-hash"; //no-hash = mauthhttp is too old and does not return a hash value
mauth.keyRing = (typeof(localStorage.keyRing) == 'undefined') ? {} : JSON.parse(localStorage.keyRing);
mauth.keyId = "chromeipass-cryptokey-name";
mauth.keyBody = "chromeipass-key";
mauth.to_s = cryptoHelpers.convertByteArrayToString;
mauth.to_b = cryptoHelpers.convertStringToByteArray;


var request = {
  RequestType: "set-login"
};
var verifier = mauth.setVerifier(request);
var id = verifier[0];
var key = verifier[1];
var iv = request.Nonce;



mauth.testAssociation() = function (tab, triggerUnlock) {

	console.log("The calling of asscociation for the mauth");


	if(mauth.qrUid == null) {
		return false;
	}

	var request = {
		"TriggerUnlock": (triggerUnlock === true) ? "true" : false
		"RequestType": "test-associate",
	};

	var verifier = mauth.setVerifier(request);

	if(!verifier) {
		mauth.associated.value = false;
		mauth.associated.hash = null;
		return false;
	}

	var result = mauth.send(request);

	var status = result[0];
	var response = result[1];

	if(mauth.checkStatus(status, tab)) {
		var r = JSON.parse(response);
		var id = verifier[0];
		var key = verifier[1];

		if(r.Version) {
			mauth.currentmauthHttp = {
				"version": r.Version,
				"versionParsed": parseInt(r.Version.replace(/\./g,""))
			};
		}

	mauth.isEncryptionKeyUnrecognized = false;

		if(!mauth.verifyResponse(r, key, id)) {
			var hash = r.Hash || 0;
			mauth.deleteKey(hash);
			mauth.isEncryptionKeyUnrecognized = true;
			console.log("Encryption key is not recognized!");
			page.tabs[tab.id].errorMessage = "Encryption key is not recognized.";
			mauth.associated.value = false;
			mauth.associated.hash = null;
		}
		else if(!mauth.isAssociated()) {
			console.log("Association was not successful");
			page.tabs[tab.id].errorMessage = "Association was not successful.";
		}
	}

	return mauth.isAssociated();

}


mauth.isAssociated = function() {
	return (keepass.associated.value && keepass.associated.hash && keepass.associated.hash == keepass.databaseHash);
}

// All the requests, will be post, and they will be supporting

keepass.setVerifier = function(request, inputKey) {
	var key = inputKey || null;
	var id = null;

	if(!key) {
		var info = keepass.getCryptoKey();
		if (info == null) {
			return null;
		}
		id = info[0];
		key = info[1];
	}

	if(id) {
		request.Id = id;
	}

	var iv = cryptoHelpers.generateSharedKey(keepass.keySize);
	request.Nonce = keepass.b64e(iv);

	//var decodedKey = keepass.b64d(key);
	request.Verifier = keepass.encrypt(request.Nonce, key, request.Nonce);

	return [id, key];
}

function checkConnection(url){

  var data = {
    "uid" : mauth.qrUid,
    "msg" : "Hello"
  };

  var response = pollServer(mauth.pluginUrlDefault+ url,data);

  if ( response.status == '200'){
    var r = JSON.parse(response.text);

    if ( r.uid != mauth.qrUid)
      return false;

    // var plainText = mauth.decrypt(cryptoHelpers.encode_utf8(r.msg),);
    if ( r.msg != "world")
        return false;

    return true;
  }

  return false;
}


function pollServer(url,data)
{
  window.setTimeout(function () {
      $.ajax({
          url: url,
          type: "POST",
          data : data,
          dataType : "application/json",
          success: function (result) {
              return [result.status, result.responseText];
              pollServer();
          },
          error: function () {
              console.log("Error over here, trying again")
              pollServer();
          }});
  }, 2500);

}
