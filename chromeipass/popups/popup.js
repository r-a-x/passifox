function status_response(r) {

	$('#initial-state').hide();
	$('#error-encountered').hide();
	$('#need-reconfigure').hide();
	$('#not-configured').hide();
	$('#configured-and-associated').hide();
	$('#configured-not-associated').hide();
	$('#connect-button').hide();

	console.log(r);
	r.isServerAvailable = true;
	if ( r.isMobileAvailable && r.isServerAvailable){
		$('#connected-and-associated').show();
		$('#associated-identifier').html(r.mobileName);
		$('#reload-status-button').show();
		$('#reload-status-button').text("Reconnect");
	}
	else if ( !r.associated && r.isServerAvailable){
		$('#connected-not-associated').show();
		$('#unassociated-identifier').html(r.identifier);
		$('#connect-button').show();
	}
	else if ( !r.isServerAvailable ){
		$('#error-encountered').show();
		$('#error-message').html("No Internet Connection or the Server is down");
		$('#connect-button').show();
	}
	else if ( !r.isMobileAvailable){
		$('#error-encountered').show();
		$('#error-message').html(r.error);
		$('#connect-button').show();
	}

}


	$("#connect-button").click(function(){
		chrome.extension.sendMessage({
			action:"connect",
		},status_response);
		chrome.tabs.sendMessage({
			action:"connect",
		},status_response);
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
	//
console.log("This is going to check the connection");
	chrome.extension.sendMessage(
		{
		action: "get_status"
	}, status_response);
