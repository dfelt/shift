window.ScanView = Backbone.View.extend({
    
    events: {
        'vclick #scan-begin-btn' : 'scanCode'
    },
    
    initialize: function() {
        this.setElement($('#scan'));
    },
    
    // Scan QR code and extract data
    scanCode: function() {
        var fields = this.fields;
        window.plugins.barcodeScanner.scan(function(scan) {
            console.log('scan result: ' + JSON.stringify(scan));
            $('#scan-results').data('results', scan);
            $.mobile.changePage('#scan-results');
       }, window.alert);
    }
});