// The file responsible for handling the network requests etc
var network={}
network.async = {};
network.sync={};
network.async.timeOut = 1;
network.sync.timeOut = 1 ;

network.async.timeOutHandler  = function (url,data){
      console.error("The request for Async" + url + " timed out along with data " + data );
}
network.sync.timeOutHandler = function ( url, data){
      console.error("The request for Sync" + url + " timed out along with data " + data );
}
network.async.successHandler = function(data,status,xhr){
      console.log("In the default Async success Handler");
      console.log("The data is :" + data + " status is " + status );
}
network.async.errorHandler = function(data,status,xhr){
      console.log("Oops !! Error connecting to the server Aysc");
}
network.successHandler = function(data,status,xhr){
      console.log("Success the data is received from the App");
      return JSON.parse(xhr.data);
}
network.sendSync = function(url,data,successHandler,errorHandler){
      errorHandler = errorHandler || network.errorHandler;
      return http(url,data);
}

network.sendAsync = function(handler,callback,args,url,jsonData,errorHandler){
  console.log("In the network sendAsync function ");;
  console.log("The data is ", jsonData);
  return httpAsync(handler,callback,args,url,JSON.stringify(jsonData),errorHandler || network.errorHandler);
}

function httpAsync(handler,callback,args,url,data,errorHandler){
  console.log("The call to the httpAsync function");
  console.log("The errorHandler is " , errorHandler);
  var xhr = new XMLHttpRequest();
  xhr.withCredentials = true;
  xhr.timeout = network.asyncTimeOut;
  xhr.errorHandler = errorHandler;

  xhr.addEventListener("readystatechange", function () {

    if (this.readyState === 4) {
      console.log("The call returned from the http Event!!");
      console.log("Calling the SuccessHandler");
      console.log("The response text is " + this.responseText);
      console.log("The status is " + this.status);
      console.log("The arguments in the callback is ",args);
      handler(callback,args,this.status,this.responseText);
    }

  });

  xhr.open("POST", url);
  xhr.setRequestHeader("content-type", "application/json");
  xhr.setRequestHeader("cache-control", "no-cache");
  xhr.send(data);

}

function http(url ,request) {
	var xhr = new XMLHttpRequest();
  xhr.timeout = network.syncTimeOut;
	xhr.open("POST", url, false);
  // xhr.setTimeout(function () {
  //
  // }, );
	xhr.setRequestHeader("Content-Type", "application/json");
	try {
		var r = JSON.stringify(request);
		page.debug("Request: {1}", r);
		xhr.send(r);
	}
	catch (e) {
		console.log("Mauth: " + e);
	}
	page.debug("Response: {1} => {2}", xhr.status, xhr.responseText);
	return [xhr.status, xhr.responseText];
}

var data = JSON.stringify({
  "uid": "e4324wfsdfsdf",
  "deviceType": "browser",
  "connectTo": "mobile",
  "forceConnect": true
});
