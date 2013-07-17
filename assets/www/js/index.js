
$(document).on('deviceready', function() {
    var apps = new AppCollection();
    
    // Views attach listeners on initialization
    new ScanView();
    new ScanResultsView({ apps: apps });
    new OcrOptionsView();
    new OcrView();
    new BookmarksPageView({ collection: new BookmarkCollection() });
    new BookmarkEditView();
    new AppPageView({ collection: apps });
    new AppEditView();
});

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