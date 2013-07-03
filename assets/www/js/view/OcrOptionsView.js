
var OcrOptionsView = Backbone.View.extend({
    
    events: {
        'vclick #camera-button':        'getCameraPicture',
        'vclick #photo-library-button': 'getLibraryPicture'
    },
    
    initialize: function() {
        this.setElement($('#ocr-options'));
    },

    getCameraPicture: function() {
        this.getPicture(navigator.camera.PictureSourceType.CAMERA);
    },

    getLibraryPicture: function() {
        this.getPicture(navigator.camera.PictureSourceType.PHOTOLIBRARY);
    },
    
    getPicture: function(pictureSource) {
        var channel = this.options.channel;
        var setPhoto = function(photoUri) {
            channel.trigger('ocr:setPhoto', photoUri);
            window.location.hash = 'ocr';
        };
        var alertError = function(message) {
            window.alert('Error: ' + message);
        };
        var size = Math.max($(window).width(), $(window).height());
        var opts = {
                sourceType:      pictureSource,
                destinationType: navigator.camera.DestinationType.FILE_URI,
                targetWidth:     size,
                targetHeight:    size
        };
        
        navigator.camera.getPicture(setPhoto, alertError, opts);
    }
});