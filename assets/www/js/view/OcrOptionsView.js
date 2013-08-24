
window.OcrOptionsView = Backbone.View.extend({
    
    events: {
        'pagebeforeshow'            : 'readParams',
        'vclick #ocr-camera-btn'    : 'getPhoto'
    },
    
    isService: false,
    lang: 'eng',
    
    initialize: function() {
        this.setElement($('#ocr-options'));
    },
    
    readParams: function(e) {
        var query = $.getQueryVars();
        this.isService = (query.service === 'true');
        this.lang = query.lang || 'eng';
        if (this.isService) {
            this.getCameraPicture();
        }
    },
    
    // We debounce because of android double-tap bug
    getPhoto: function() {
        console.log('getPhoto');
        var self = this;
        
        var app = $('#ocr-app').val();
        if (app === 'Accession Number'
                && (!localStorage.getItem(SettingsPageView.EMAIL)
                ||  !localStorage.getItem(SettingsPageView.URL))) {
            window.alert("This app requires a server URL for tracking patient updates " +
                    "and an email address for recieving updates.");
            $.mobile.changePage('#settings');
            return;
        }
        
        var gotoOcrPage = function(photoUri) {
            self.setCameraButtonEnabled(true);
            
            $('#ocr').data({
                photoUri: photoUri,
                service: false,
                lang: self.lang,
                app: $('#ocr-app').val()
            });
            $.mobile.changePage('#ocr');
        };
        var alertError = function(message) {
            self.setCameraButtonEnabled(true);
            
            if (self.isService) {
                window.location.href = 'app://ocr?' + $.param({
                    success: false,
                    message: message
                });
            } else if (!(/cancel/i).test(message)){
                // Only alert if message doesn't contain "cancel", which
                // probably means the user cancelled the camera picture
                window.alert(message);
            }
        };
        var size = Math.max($(window).width(), $(window).height());
        console.log('size: ' + size);
        var opts = {
                sourceType:      navigator.camera.PictureSourceType.CAMERA,
                destinationType: navigator.camera.DestinationType.FILE_URI,
                targetWidth:     size,
                targetHeight:    size
        };
        
        this.setCameraButtonEnabled(false);
        
        // Delay camera to allow page to render and show loading symbol
        _.delay(function() {
            navigator.camera.getPicture(gotoOcrPage, alertError, opts);
        }, 100);
    },
    
    setCameraButtonEnabled: function(enable) {
        if (enable) {
            $('#ocr-camera-btn').button('enable');
            $.mobile.loading('hide');
        } else {
            $('#ocr-camera-btn').button('disable');
            $.mobile.loading('show');
        }
    }
});