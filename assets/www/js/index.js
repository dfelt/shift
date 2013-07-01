
$(document).on('deviceready', function() {
    // channel is used to send messages between views
    var channel = _.extend({}, Backbone.Events);
    
    var homeView = new HomeView({ channel: channel });
    var ocrView = new OcrView({ channel: channel });

});

/**
  *==================================
  * Function for scanning the Qrcode
  *==================================
**/  

var scanCode = function() {
    window.plugins.barcodeScanner.scan(
        function(result) {
        document.getElementById("content").style.display = "inline";
        document.getElementById("ScannedCode").innerHTML="Scanned Code: " + result.text;
        changeDisplay (result.text);
        $('#launch').data('scannedCode', result.text);
    	if ($('#launch').data('appName') == undefined){
    		//TODO: launch the url-pannel
        	$("#chooseUrl").click();
    	}
    }, function(error) {
        alert("Scan failed: " + error);
    });
}

/**
  *===========================================
  * Function to divide and display scannedCode 
  *===========================================
**/ 

function changeDisplay (scannedCode){
	document.getElementById("ScannedCode").innerHTML="Scanned Code: " + scannedCode;
	var obj = jsonBuilder (scannedCode);
	document.getElementById("mrn").innerHTML="MRN: " + obj.mrn;
	document.getElementById("acc").innerHTML="Exam: " + obj.acc;
	document.getElementById("pt").innerHTML="Patient Name: " + obj.pt;
}

/**
  *================================================
  * Function for building jSon obj from scannedCode
  *================================================
**/  

function jsonBuilder (scannedCode){
	var scannedArr = scannedCode.split(':');
	var obj = new Object();
	obj.mrn = scannedArr[0];
	obj.pt  = scannedArr[1];
	obj.acc = scannedArr[2];
	obj.pubmed = scannedArr[3];
	return obj;
}

/**
  *======================================================
  * Function for switching between different applications
  *======================================================
**/  

function switchApp(appName){
    if (appName === "PubMed"){
        document.getElementById('appName').innerHTML = "PubMed";
        $('#launch').data('appName',"http://www.ncbi.nlm.nih.gov/m/pubmed/");
        $('#launch').data('appId',"PubMed");
    }
    if (appName === "foo"){
    	document.getElementById('appName').innerHTML = "Application Name: Foo";
        $('#launch').data('appName',"http://www.google.com/");
        $('#launch').data('appId',"Foo");
    }
}

/**
  *======================================
  * Functions for launching an application
  *======================================
**/  

function openApp(linkId) {
    var appName = $("#" + linkId).data('appName');
    var scannedCode = $("#" + linkId).data('scannedCode');
    if ($('#launch').data('appName') == undefined){
    	//TODO: launch the url-pannel
        $("#chooseUrl").click();
    }else if ($('#launch').data('scannedCode') == undefined || scannedCode == ""){
		alert("Please scan again or choose from your bookmarks.");    	
    }else{
    	var url = appName + fieldHandler(linkId);
    	var ref = window.open(url, '_blank', 'location=yes');
    }
}

function fieldHandler (linkId){
	var appName = $("#" + linkId).data('appName');
    var scannedCode = $("#" + linkId).data('scannedCode');
    var appId = $("#" + linkId).data('appId');
    var jsonObj = jsonBuilder (scannedCode);
    if (appId === "PubMed"){
    	var ret = jsonObj.pubmed;
    }else{
		var ret = "?mrn=" + jsonObj.mrn + "&acc=" + jsonObj.acc + "&pt=" + jsonObj.pt;
	}
	return ret;    
}


/**
  *=====================================
  * Function for switching to a bookmark
  *=====================================
**/  

function openBookMarks(id){
	var scannedCode = $("#" + id).data('scannedCode');
	var appName = $("#" + id).data('appName');
	var appId = $("#" + id).data('appId');
	document.getElementById("content").style.display = "inline";
    document.getElementById("ScannedCode").innerHTML="Scanned Code: " + scannedCode;
    changeDisplay(scannedCode);
    $('#launch').data('scannedCode', scannedCode);
    $('#launch').data('appName', appName);
    document.getElementById('appName').innerHTML = "Application Name: " + appId;
}

/**
  *========================================
  * Function for adding record to bookmarks
  *========================================
**/  

function addBookmarks() {
	var scannedCode =  $('#launch').data('scannedCode');
	var appName = $('#launch').data('appName');
	var appId = $('#launch').data('appId');
	var url = appId + scannedCode.split(':').join('').split('_').join('');
	var disName = appId + ' ' + scannedCode.split(':')[1];
	if ($('#launch').data('appName') == undefined){
    	//TODO: launch the url-pannel
        $("#chooseUrl").click();
    }else if ($('#launch').data('scannedCode') == undefined || scannedCode == ""){
		alert("Please scan again.");    	
    }else if ($("#" + url).length == 0){
		$('#bookmarks').append('<li id="' + url + '"><a href="#favorite" data-rel="close" id="' + url + '" onclick="openBookMarks(id);"' + '>' + disName +'</a><a href="#bookmarkHandler" id="' + url + '" data-rel="popup" onclick="bookmarkHandlerHelper(id);" data-position-to="window" data-transition="pop"></a></li>'); 
		$('#bookmarks').listview("refresh");
		$("#" + url).data('scannedCode', scannedCode);
		//alert($("#" + url).data('scannedCode'));
		$("#" + url).data('appName', appName);
		$("#" + url).data('appId', appId);
		$('#bookmarks').listview("refresh");
		$('#chooseFavorite').click();
	}	
}

function bookmarkHandlerHelper(url){
	$('#bookmarkHandler').data('id',url);
}

function deleteBookmark(){
	var url = $('#bookmarkHandler').data('id');
	$("#" + url).remove();
	$('#bookmarks').listview("refresh");
}

function urlHandlerHelper(url){
	$('#urlHandler').data('id',url);
}

function deleteUrl(){
	var id = $('#urlHandler').data('id');
	$("#" + id).remove();
	$('#url').listview("refresh");
}