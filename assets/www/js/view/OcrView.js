
window.OcrView = Backbone.View.extend({
    
    events: {
        'pageshow'                    : 'render',
        'pagehide'                    : 'onHide',
        'touchstart  #draw-canvas'    : 'startDraw',
        'touchmove   #draw-canvas'    : 'moveDraw',
        'touchend    #draw-canvas'    : 'endDraw',
        'vclick      #ocr-text-delete': 'clearText',
        'vclick      #ocr-text-accept': 'submit'
    },
    
    ocr: cordova.require('cordova/plugin/ocr'),
    
    // Constants
    unselectedWordColor: 'rgba(255, 255, 0, 0.15)',
    selectedWordColor:   'rgba(255, 255, 0, 0.4)',
    clearDuration: 1000,
    confidenceThreshold: 50,
    
    photo: new Image(),
    scale: 1.0,
    
    words: {},
    selectedWords: [],
    haveWordText: false,
    
    currentTouchPaths: {},
    finishedTouchPaths: [],
    
    lastDrawTime: 0,
    
    ocrOptions: {},
    
    isService: false,
    
    initialize: function(options) {
        this.setElement($('#ocr'));
        
        this.photoCanvas = document.getElementById('photo-canvas');
        this.drawCanvas  = document.getElementById('draw-canvas');
        this.photoCtx = this.photoCanvas.getContext('2d');
        this.drawCtx = this.drawCanvas.getContext('2d');
        
        this.ocrTextbox = $('#ocr-text');

        // Workaround for: code.google.com/p/android/issues/detail?id=35474
        $(this.photoCanvas).parents().css('overflow', 'visible');
        
        _.bindAll(this, 'repaint', 'setWordBoxes', 'alertError', 'setWordTexts');
    },
    
    render: function() {
        var self = this;
        
        // Get URL query params
        var query = $.getQueryVars();
        this.isService = query.service;
        this.photo.src = query.photo;
        
        // We need to wait for the photo to load before we can work with it
        $(this.photo).one('load', function() {
            //$(this.photoCanvas).fadeIn(2000, function() {
            //    $('#draw-canvas').show();
            //});
            $(window).on('resize', self.repaint).resize();
        }).each(function() {
            if (this.complete) { $(this).load(); }
        });

        this.words = [];
        this.selectedWords = [];
        this.haveWordText = false;
        this.currentTouchPaths = {};
        this.finishedTouchPaths = [];
        this.ocrTextbox.val('');
        this.ocr.getWordBoxes(this.photo.src, this.setWordBoxes, this.alertError);
        return this;
    },
    
    onHide: function() {
        $(window).off('resize', this.repaint);
        this.photoCtx.clearRect(0, 0, this.photoCanvas.width, this.photoCanvas.height);
        this.drawCtx.clearRect(0, 0, this.drawCanvas.width, this.drawCanvas.height);
    },
    
    repaint: function() {
        if (!this.photo.complete) { return; }
        
        // Figure out scaling factor that best fits photo to its box
        var h = $(window).height() - $('#ocr-text-wrap').height();
        var box = { width: $(window).width(),       height: h };
        var img = { width: this.photo.naturalWidth, height: this.photo.naturalHeight };
        var fitWidth = (img.width / img.height) > (box.width / box.height);
        var scale = (fitWidth ? box.width / img.width : box.height / img.height);
        this.scale = scale;
        
        // Resize
        $('#ocr-canvas-container').width(scale*img.width);
        this.photoCanvas.width  = this.drawCanvas.width  = scale*img.width;
        this.photoCanvas.height = this.drawCanvas.height = scale*img.height;
        
        // Draw photo
        this.photoCtx.drawImage(this.photo, 0, 0, scale*img.width, scale*img.height);
        
        // Draw the word boxes
        this.photoCtx.save();
        this.photoCtx.fillStyle = this.unselectedWordColor;
        _.each(this.words, this.drawWordBox, this);
        this.photoCtx.fillStyle = this.selectedWordColor;
        _.each(this.words, function(w) {
            if (w.selected) { this.drawWordBox(w); }
        }, this);
        this.photoCtx.restore();
        
        // Draw the touch paths
        this.drawCtx.globalCompositeOperation = 'copy';
        this.drawCtx.fillStyle = 'rgba(0,0,0,0.15)';
        this.drawCtx.fillRect(0, 0, this.drawCanvas.width, this.drawCanvas.height);
        
        _.each(this.finishedTouchPaths, this.clearPath, this);
        _.each(this.currentTouchPaths, this.clearPath, this);
    },
    
    setWordBoxes: function(words) {
        for (var i = 0; i < words.length; i++) {
            words[i].selected = false;
            words[i].index = i;
        }
        
        this.words = words;
        this.selectedWords = [];
        
        this.repaint();
        $(this.drawCanvas).on('touchend.loading', function() {
            $.mobile.loading('show');
        });
        
        this.ocr.getWords(this.photo.src, this.setWordTexts, this.alertError);
    },
    
    setWordTexts: function(words) {
        // Remove low-confidence words
        words = _.reject(words, function(w) {
            return w.text === '' || w.confidence < this.confidenceThreshold;
        });
        
        if (words.length === 0) {
            navigator.notification.confirm(
                    'No text found. Retake photo?',
                    function(btn) {
                        if (btn === 1) { window.location.hash = ''; }
                    },
                    'Retry?');
        }
        
        _.each(words, function(w, i) { w.index = i; });
        
        // Get new words that overlap old selected words
        var newSelectedWords = _.map(this.selectedWords, function(w) {
            return _.findWhere(words, { x: w.x, y: w.y });
        });
        this.selectedWords = _.compact(newSelectedWords);
        _.each(this.selectedWords, function(w) {
            w.selected = true;
        });
        this.updateTextbox();
        
        this.words = words;
        this.haveWordText = true;
        
        $.mobile.loading('hide');
        $(this.drawCanvas).off('touchend.loading');
        
        this.repaint();
        
        console.log('OCR: ' + JSON.stringify(words));
    },
    
    clearText: function() {
        this.ocrTextbox.val('');
        _.each(this.words, function(w) { w.selected = false; });
        this.selectedWords = [];
        this.currentTouchPaths = {};
        this.finishedTouchPaths = [];
        this.repaint();
    },
    
    getText: function() {
        return _.pluck(this.selectedWords, 'text').join(' ');
    },
    
    updateTextbox: _.debounce(function() {
        this.ocrTextbox.val(this.getText());
    }, 250),
    
    submit: function() {
        console.log('Submitting ocr text');
        if (this.isService) {
            window.location.href = 'app://ocr?' + $.param({
                success: true,
                message: this.getText()
            });
        } else {
            //TODO: what do we do with this data?
        }
    },
    
    selectWordsAt: function(point) {
        // Find word whose box contains point
        var word = _.find(this.words, function(w) {
            return w.x <= point.x && point.x <= w.x + w.w
                && w.y <= point.y && point.y <= w.y + w.h;
        });
        if (word && !word.selected) {
            word.selected = true;
            
            // Highlight word
            this.photoCtx.fillStyle = 'rgba(255, 255, 0, 0.4)';
            this.drawWordBox(word);
            
            if (this.haveWordText) {
                // Insert word into selectedWords, keeping array in sorted
                var idx = _.sortedIndex(this.selectedWords, word, 'index');
                this.selectedWords.splice(idx, 0, word);
                
                // Put new text in textbox
                this.updateTextbox();
            } else {
                this.selectedWords.push(word);
            }
        }
    },
    
    drawWordBox: function(word) {
        var s = this.scale;
        this.photoCtx.globalAlpha = word.confidence ? word.confidence/100 : 1;
        this.photoCtx.fillRect(s*word.x, s*word.y, s*word.w, s*word.h);
    },
    
    startDraw: function(evt) {
        evt.preventDefault(); // Prevent scrolling
        
        var now = Date.now();
        if (now - this.lastDrawTime > this.clearDuration) {
            this.clearText();
        }
        this.lastDrawTime = now;

        var touches = evt.originalEvent.changedTouches;
        for (var i = 0; i < touches.length; i++) {
            var t = touches[i];
            var point = this.touchToCanvasCoords(t);
            // By shifting the first point of the path, the path is immediately
            // visible on the canvas
            var offsetPoint = _.clone(point);
            offsetPoint.x += 0.01;
            this.currentTouchPaths[t.identifier] = [offsetPoint, point];
            this.clearPath(this.currentTouchPaths[t.identifier]);
            this.selectWordsAt(point);
        }
    },
    
    moveDraw: function(evt) {
        evt.preventDefault(); // Prevent scrolling
        
        this.lastDrawTime = Date.now();
        
        var touches = evt.originalEvent.changedTouches;
        for (var i = 0; i < touches.length; i++) {
            var path = this.currentTouchPaths[touches[i].identifier];
            var point = this.touchToCanvasCoords(touches[i]);
            path.push(point);
            this.clearPath(_.last(path, 2));
            this.selectWordsAt(point);
        }
        
        // Workaround: http://stackoverflow.com/questions/14339524/canvas-globalcompositeoperation-issue-on-samsung-galaxy-s3-4-1-1-4-1-2
        var c = $(this.drawCanvas);
        $(c).css('margin-right', c.css('margin-right') === "0px" ? "1px" : "0px");
    },
    
    endDraw: function(evt) {
        evt.preventDefault(); // Prevent text box from being de-selected

        this.lastDrawTime = Date.now();
        
        _.each(evt.originalEvent.changedTouches, function(t) {
            this.finishedTouchPaths.push(this.currentTouchPaths[t.identifier]);
            delete this.currentTouchPaths[t.identifier];
        }, this);
    },
    
    clearPath: function(path) {
        this.drawCtx.lineWidth = 36;
        this.drawCtx.lineCap = 'round';
        this.drawCtx.lineJoin = 'round';
        this.drawCtx.strokeStyle = 'rgba(0,0,0,1)';
        this.drawCtx.globalCompositeOperation = 'destination-out';
        
        this.drawCtx.beginPath();
        this.drawCtx.moveTo(this.scale * path[0].x, this.scale * path[0].y);
        
        for (var i = 1; i < path.length; i++) {
            this.drawCtx.lineTo(this.scale * path[i].x, this.scale * path[i].y);
        }

        this.drawCtx.stroke();
    },
    
    touchToCanvasCoords: function(touch) {
        var rect = this.drawCanvas.getBoundingClientRect();
        var x = (touch.pageX - rect.left) / this.scale;
        var y = (touch.pageY - rect.top)  / this.scale;
        return {x: x, y: y};
    },
    
    alertError: function(message) {
        window.alert('Error: ' + message);
    }
});