window.ScanView = Backbone.View.extend({
    el: '#scan',
    
    events: {
        'vclick #scan-begin-btn' : 'scanCode'
    },
    
    // Scan QR code and extract data
    scanCode: function() {
        window.plugins.barcodeScanner.scan(function(scan) {
            console.log('scan result: ' + JSON.stringify(scan));
            if (!scan.cancelled) {
                $('#scan-results').data('results', scan.text);
                $.mobile.changePage('#scan-results');
            }
       }, window.alert);
    }
});