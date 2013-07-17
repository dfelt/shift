
$(document).on('deviceready', function() {
    // Create and fetch collections
    var bookmarks = new BookmarkCollection();
    var apps = new AppCollection();
    _.defer(function() {
        bookmarks.fetch();
        apps.fetch();
    });
    
    // Create views, which attach listeners on initialization
    new ScanPageView();
    new ScanResultsView({ apps: apps });
    new OcrOptionsView();
    new OcrPageView();
    new BookmarksPageView({ collection: bookmarks });
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