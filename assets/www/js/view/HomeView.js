
var HomeView = Backbone.View.extend({
    
    events: {
        //'vclick #scanCode': 'scanCode'
    },

    initialize: function() {
        this.setElement($('#page'));
        $('#scanCode').click($.proxy(scanCode, this));
    },

    
    /**
      *==================================
      * Function for scanning the Qrcode
      *==================================
    **/  
    scanCode: function() {
        console.log('scanning code');
        var self = this;
        window.plugins.barcodeScanner.scan(
            function(result) {
                console.log('Got result: ' + JSON.stringify(result));
                document.getElementById("content").style.display = "inline";
                document.getElementById("ScannedCode").innerHTML="Scanned Code: " + result.text;
                //self.changeDisplay(result.text);
                $('#launch').data('scannedCode', result.text);
                if ($('#launch').data('appName') == undefined){
                    //TODO: launch the url-pannel
                    $("#chooseUrl").click();
                }
            },
            function(error) {
                alert("Scan failed: " + error);
            }
        );
        
        return false;
    },

    /**
      *===========================================
      * Function to divide and display scannedCode 
      *===========================================
    **/ 
    changeDisplay: function(scannedCode) {
        document.getElementById("ScannedCode").innerHTML="Scanned Code: " + scannedCode;
        var obj = this.jsonBuilder(scannedCode);
        document.getElementById("mrn").innerHTML="MRN: " + obj.mrn;
        document.getElementById("acc").innerHTML="Exam: " + obj.acc;
        document.getElementById("pt").innerHTML="Patient Name: " + obj.pt;
    },

    /**
      *================================================
      * Function for building jSon obj from scannedCode
      *================================================
    **/
    jsonBuilder: function(scannedCode){
        var data = scannedCode.split(':');
        return {
            mrn:    data[0],
            pt:     data[1],
            acc:    data[2],
            pubmed: data[3]
        };
    }
});