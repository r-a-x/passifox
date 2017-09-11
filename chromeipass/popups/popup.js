function status_response(r) {

	$('#initial-state').hide();
	$('#error-encountered').hide();
	$('#need-reconfigure').hide();
	$('#not-configured').hide();
	$('#configured-and-associated').hide();
	$('#configured-not-associated').hide();

	// console.log(r.error);
	console.log(r);
	// identifier:qr.uid,
	// isMauthMobileAvailable:mauth.isMauthMobileAvailable,
	// isMauthServerAvailable:mauth.isMauthServerAvailable,
	// associated: connected,
	// error

if ( r.isMauthMobileAvailable && r.isMauthServerAvailable){
	console.log("Both are connected");
	$('#reload-status-button').text("Reconnect");
}
else if ( !r.isMauthServerAvailable ){
	$('#error-encountered').show();
	$('#error-message').html("No Internet Connection");
}
else if ( !r.isMauthMobileAvailable){
	$('#error-encountered').show();
	$('#error-message').html(r.error);
}

}

$(function() {
	$("#connect-button").click(function() {
		chrome.extension.sendMessage({
			action: "associate"
		});
		close();
	});

	$("#reconnect-button").click(function() {
		chrome.extension.sendMessage({
			action: "associate"
		});
		close();
	});

// This is the method, that will run initially and this will provide
// me with the data regarding the user is connected or not

	$("#reload-status-button").click(function() {
		chrome.extension.sendMessage({
			action: "get_status"
		}, status_response);
	});

	$("#redetect-fields-button").click(function() {
		chrome.tabs.query({"active": true, "windowId": chrome.windows.WINDOW_ID_CURRENT}, function(tabs) {
			if (tabs.length === 0)
				return; // For example: only the background devtools or a popup are opened
			var tab = tabs[0];

			chrome.tabs.sendMessage(tab.id, {
				action: "redetect_fields"
			});
		});
	});

// The function responsible for the checking of init functionalty
	chrome.extension.sendMessage({
		action: "get_status"
	}, status_response);
});
