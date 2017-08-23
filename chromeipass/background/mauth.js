mauth={}

mauth.associated = {"value": false, "hash": null};
mauth.qrUid=null;
mauth.isDatabaseClosed = false;
mauth.isMauthHttpAvailable = false;
mauth.isEncryptionKeyUnrecognized = false;
mauth.currentMauthHttp = {"version": 0, "versionParsed": 0};
mauth.latestMauthHttp = (typeof(localStorage.latestmauthHttp) == 'undefined') ? {"version": 0, "versionParsed": 0, "lastChecked": null} : JSON.parse(localStorage.latestmauthHttp);
mauth.keySize = 8; // wtf? stupid cryptoHelpers
mauth.pluginUrlDefault = "http://localhost:19455";
mauth.latestVersionUrl = "https://passifox.appspot.com/kph/latest-version.txt";
mauth.cacheTimeout = 30 * 1000; // milliseconds
mauth.databaseHash = "no-hash"; //no-hash = mauthhttp is too old and does not return a hash value
mauth.keyRing = (typeof(localStorage.keyRing) == 'undefined') ? {} : JSON.parse(localStorage.keyRing);
mauth.keyId = "chromeipass-cryptokey-name";
mauth.keyBody = "chromeipass-key";
mauth.to_s = cryptoHelpers.convertByteArrayToString;
mauth.to_b = cryptoHelpers.convertStringToByteArray;

function checkConnection(url){
  console.log("The url is " + url );

  var data = {
    "uid" : mauth.qrUid,
    "msg" : "Hello"
  };

  var response = pollServer(mauth.pluginUrlDefault+ url,
    data,
    function(data,status,xhr) {
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
    );

return response;

}


function pollServer(url,data,successHandler)
{
      $.ajax({
          url: url,
          contentType:"application/json",
          type: "POST",
          timeout:5000,
          data: JSON.stringify(data),
          success: successHandler,
          error: function (data,status,xhr) {
              if ( xhr.status == 404 || xhr.status == 415 )
                pollServer(url,data,successHandler);
          }
        });
}



mauth.testAssociation = function (tab, triggerUnlock) {
	console.log("The calling of asscociation for the mauth");
  return checkConnection("/isconnected");
}
