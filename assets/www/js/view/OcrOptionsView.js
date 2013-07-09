
window.OcrOptionsView = Backbone.View.extend({
    
    events: {
        'pagebeforeshow'               : 'readParams',
        'vclick #camera-button'        : 'getCameraPicture',
        'vclick #photo-library-button' : 'getLibraryPicture'
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

    getCameraPicture: function() {
        this.getPhoto(navigator.camera.PictureSourceType.CAMERA);
    },

    getLibraryPicture: function() {
        this.getPhoto(navigator.camera.PictureSourceType.PHOTOLIBRARY);
    },
    
    getPhoto: function(pictureSource) {
        var self = this;
        var gotoOcrPage = function(photoUri) {
            var page = $('#ocr')[0];
            $.data(page, 'photoUri', photoUri);
            $.data(page, 'service', false);
            $.data(page, 'lang', self.lang);
            $.mobile.changePage($(page));
        };
        var alertError = function(message) {
            if (self.isService) {
                window.location.href = 'app://ocr?' + $.param({
                    success: false,
                    message: message
                });
            } else {
                window.alert(message);
            }
        };
        var size = Math.max($(window).width(), $(window).height());
        var opts = {
                sourceType:      pictureSource,
                destinationType: navigator.camera.DestinationType.FILE_URI,
                targetWidth:     size,
                targetHeight:    size
        };
        
        navigator.camera.getPicture(gotoOcrPage, alertError, opts);
    }
});