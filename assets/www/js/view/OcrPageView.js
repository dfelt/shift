
window.OcrPageView = Backbone.View.extend({
    el: '#ocr',
    
    events: {
        'pageshow'                    : 'render',
        'pagehide'                    : 'onHide',
        'touchstart  #draw-canvas'    : 'startDraw',
        'touchmove   #draw-canvas'    : 'moveDraw',
        'touchend    #draw-canvas'    : 'endDraw',
        'vclick      .ui-input-clear' : 'clearText',
        'vclick      #ocr-text-accept': 'submit'
    },
    
    ocr: cordova.require('cordova/plugin/ocr'),
    
    // Constants
    unselectedWordColor: 'rgba(255, 255, 0, 0.15)',
    selectedWordColor:   'rgba(255, 255, 0, 0.4)',
    clearDuration: 1000,
    confidenceThreshold: 25,
    lineWidth: 36,
    defaultLanguage: 'eng',
    
    photo: new Image(),
    scale: 1.0,
    
    words: [],
    selectedWords: [],
    haveWordText: false,
    
    currentTouchPaths: {},
    finishedTouchPaths: [],
    
    initialBounds: { minX: Number.MAX_VALUE, minY: Number.MAX_VALUE, maxX: 0, maxY: 0 },
    boundsExpanded: false,
    
    lastDrawTime: 0,
    
    isService: false,
    
    initLanguage: null,
    
    firstRender: true,
    
    initialize: function(options) {
        this.photoCanvas = $('#photo-canvas')[0];
        this.drawCanvas  = $('#draw-canvas')[0];
        this.photoCtx = this.photoCanvas.getContext('2d');
        this.drawCtx = this.drawCanvas.getContext('2d');
        
        this.ocrTextbox = $('#ocr-text');

        // Workaround for: code.google.com/p/android/issues/detail?id=35474
        $(this.photoCanvas).parents().css('overflow', 'visible');
        
        _.bindAll(this, 'repaint', 'ocrSetWhiteList', 'ocrInit', 'ocrSetImage',
                'ocrGetWords', 'ocrGetText', 'ocrGetWords2', 'ocrGetResults',
                'ocrSetResults', 'scheduleOcrAction', 'alertError');
        
        this.ocrInit(this.defaultLanguage, function(){});
    },
    
    render: function(e) {
        var self = this;
        this.clearData();
        
        // Get page data
        this.isService = this.$el.data('service');
        this.photo.src = this.$el.data('photoUri');
        this.app = this.$el.data('app');
        
        if (this.app === 'PubMed Article') {
            this.whiteList = '0123456789';
            this.scheduleOcrAction(function() { self.ocrInit('eng', self.ocrSetWhiteList); });
        } else {
            var init = _.partial(self.ocrInit, self.$el.data('lang'), self.ocrSetImage, self);
            this.scheduleOcrAction(function() { self.ocr.end(init, self.alertError); });
        }
        
        // We need to wait for the photo to load before we can work with it
        $(this.photo).one('load', function() {
            self.rectangle = {x: 0, y: 0,
                    width: this.naturalWidth, height: this.naturalHeight };
            // For some reason, only on the first render this bug appears:
            // code.google.com/p/android/issues/detail?id=35474
            // This seems to fix the problem
            if (self.firstRender) {
                self.firstRender = false;
                var content = $('#ocr-content').detach();
                _.defer(function() { self.$el.append(content); });
            }
            $(window).on('resize', self.repaint).resize();
        }).each(function() {
            if (this.complete) { $(this).load(); }
        });
        
        return this;
    },
    
    onHide: function() {
        this.clearData();
        $(window).off('resize', this.repaint);
        this.photoCtx.clearRect(0, 0, this.photoCanvas.width, this.photoCanvas.height);
        this.drawCtx.clearRect(0, 0, this.drawCanvas.width, this.drawCanvas.height);
        this.photo.src = '';
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
        this.photoCanvas.width  = this.drawCanvas.width = 1;
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
    
    ocrInit: function(lang, onSuccess, force) {
        lang = lang || this.initLanguage || this.defaultLanguage;
        if (force || lang !== this.initLanguage) {
            this.initLanguage = lang;
            this.ocr.init(onSuccess, this.alertError, this.initLanguage);
        } else {
            _.defer(onSuccess);
        }
    },
    
    ocrSetWhiteList: function() {
        this.ocr.setVariable(this.ocrSetImage, this.alertError,
                this.ocr.VAR_CHAR_WHITELIST, this.whiteList);
    },
    
    // After OCR init finishes, set the image
    ocrSetImage: function() {
        this.ocr.setImage(this.ocrGetWords, this.alertError, this.photo.src);
    },
    
    // After OCR setImage finishes, get word boxes
    ocrGetWords: function() {
        this.ocr.getWords(this.ocrGetText, this.alertError);
    },
    
    // After we get word boxes, highlight them on the canvas, and begin recognition
    ocrGetText: function(words) {
        for (var i = 0; i < words.length; i++) {
            words[i].selected = false;
            words[i].index = i;
        }
        
        this.words = words;
        this.selectedWords = [];
        
        this.repaint();
        
        // Show a loading indicator if the user selects words before recognition is finished
        $(this.drawCanvas).on('touchend.loading', function() {
            $.mobile.loading('show');
        });
        
        // We need to force recognition before we can get individual word text
        this.ocr.getUTF8Text(this.ocrGetWords2, this.alertError);
    },
    
    // After recognition is finished, get the word boxes again, as they may
    // have changed
    ocrGetWords2: function() {
        this.ocr.getWords(this.ocrGetResults, this.alertError);
    },
    
    // After getting the updated word boxes, we get the actual word text
    ocrGetResults: function(words) {
        _.each(words, function(w) {
            w.x += this.x; w.y += this.y;
        }, this.rectangle);
        this.tempWordBoxes = words;
        this.ocr.getResults(this.ocrSetResults, this.alertError,
                this.ocr.PageIteratorLevel.RIL_WORD);
    },
    
    // After we get the word texts, highlight them in the picture
    ocrSetResults: function(words) {
        var self = this;
        
        // Join together word texts and word boxes
        for (var i = 0; i < words.length; i++) {
            _.extend(words[i], this.tempWordBoxes[i]);
        }
        this.tempWordBoxes = null;
        
        // Remove whitespace and low-confidence words
        words = _.reject(words, function(w) {
            return (/^\s*$/).test(w.text) || w.confidence < this.confidenceThreshold;
        }, this);

        // Remove words that overlap new words so we can replace them, and words without text
        this.words = _.reject(this.words, function(a) {
            return !a.text || _.some(words, function(b) {
                return (a.x < b.x + b.w) && (a.x + a.w > b.x)
                    && (a.y < b.y + b.h) && (a.y + a.h > b.y);
            });
        });
        
        // Orders words by their position on the page
        function wordOrder(a, b) {
            // If the words are on (roughly) the same line, order by x, else by y
            var tol = (a.h + b.h) / 4;
            return Math.abs(a.y - b.y) < tol ? a.x - b.x : a.y - b.y;
        }
        
        // Merges two arrays, using compare to order elements
        function merge(left, right, compare) {
            var result = [],
                i = 0,
                j = 0;
            while(i < left.length && j < right.length) {
                if (compare(left[i], right[j]) <= 0) { result.push(left[i++]);  }
                else                                 { result.push(right[j++]); }
            }
            while (i < left.length)  { result.push(left[i++]);  }
            while (j < right.length) { result.push(right[j++]); }
            return result;
        }
        
        this.words = merge(this.words, words, wordOrder);
        _.each(this.words, function(w, i) { w.index = i; w.selected = false; });
        this.selectedWords = [];
        
        // Reselect words
        _.each(this.finishedTouchPaths, function(path) {
            _.each(path, function(point) {
                self.selectWordsAt(point);
            });
        });
        
        this.updateTextbox();
        
        this.haveWordText = true;
        
        $.mobile.loading('hide');
        $(this.drawCanvas).off('touchend.loading');
        
        this.repaint();
        
        console.log('OCR: ' + JSON.stringify(_.pluck(words, 'text')));
        
        // If another function is scheduled to run, run it now
        if (this.nextOcrAction) {
            var act = this.nextOcrAction;
            this.nextOcrAction = null;
            act();
        } else {
            this.isRunningOcr = false;
        }
    },
    
    ocrSetRectangle: function(rect) {
        var self = this;
        this.scheduleOcrAction(function() {
            $.mobile.loading('show');
            self.rectangle = rect;
            self.ocr.setRectangle(_.identity, self.alertError, rect);
            self.ocr.getUTF8Text(self.ocrGetWords2, self.alertError);
        });
    },
    
    scheduleOcrAction: function(f) {
        if (this.isRunningOcr) {
            this.nextOcrAction = f;
        } else {
            this.isRunningOcr = true;
            f();
        }
    },
    
    clearText: function() {
        this.ocrTextbox.val('');
        _.each(this.words, function(w) { w.selected = false; });
        this.selectedWords = [];
        this.currentTouchPaths = {};
        this.finishedTouchPaths = [];
        this.bounds = _.clone(this.initialBounds);
        this.repaint();
    },
    
    updateTextbox: _.debounce(function() {
        var text = _.pluck(this.selectedWords, 'text').join(' ');
        this.ocrTextbox.val(text);
    }, 250),
    
    submit: function() {
        var text = this.ocrTextbox.val();
        if (this.isService) {
            window.location.href = 'app://ocr?' + $.param({
                success: true,
                message: text
            });
        } else {
            if (this.app === 'PubMed Article') {
                var url = 'http://www.ncbi.nlm.nih.gov/pubmed/' + text.trim();
                window.open(url, '_system');
            }
        }
    },
    
    selectWordsAt: function(point) {
        // Expand bounds to include point
        this.expandBounds(point);

        // Find word whose box contains point
        var word = _.find(this.words, function(w) {
            return w.x <= point.x && point.x <= w.x + w.w
                && w.y <= point.y && point.y <= w.y + w.h;
        });
        if (word && !word.selected) {
            word.selected = true;
            
            // Expand bounds to fit box
            this.expandBounds(word);
            this.expandBounds({x: word.x + word.w, y: word.y + word.h});
            
            // Highlight word
            this.photoCtx.fillStyle = 'rgba(255, 255, 0, 0.4)';
            this.drawWordBox(word);
            
            if (this.haveWordText) {
                // Insert word into selectedWords while keeping array sorted
                var idx = _.sortedIndex(this.selectedWords, word, 'index');
                this.selectedWords.splice(idx, 0, word);
                
                // Put new text in textbox
                this.updateTextbox();
            } else {
                this.selectedWords.push(word);
            }
        }
    },
    
    expandBounds: function(point) {
        var b = this.bounds;

        if (point.x < b.minX) {
            b.minX = point.x;
            this.boundsExpanded = true;
        }
        if (point.x > b.maxX) {
            b.maxX = point.x;
            this.boundsExpanded = true;
        }
        if (point.y < b.minY) {
            b.minY = point.y;
            this.boundsExpanded = true;
        }
        if (point.y > b.maxY) {
            b.maxY = point.y;
            this.boundsExpanded = true;
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
        c.css('margin-right', c.css('margin-right') === "0px" ? "1px" : "0px");
    },
    
    endDraw: function(evt) {
        evt.preventDefault(); // Prevent text box from being de-selected

        this.lastDrawTime = Date.now();
        
        _.each(evt.originalEvent.changedTouches, function(t) {
            this.finishedTouchPaths.push(this.currentTouchPaths[t.identifier]);
            delete this.currentTouchPaths[t.identifier];
        }, this);
        
        // Redo OCR, but only within this.bounds
        if (this.boundsExpanded) {
            this.boundsExpanded = false;
            var b = this.bounds,
                r = this.lineWidth / 2,
                s = this.scale;
                rect = {
                    x: b.minX-r,
                    y: b.minY-r,
                    width:  b.maxX-b.minX + 2*r,
                    height: b.maxY-b.minY + 2*r
                };
            // Make sure rectangle fits within the image
            rect.x = Math.max(rect.x, 0);
            rect.y = Math.max(rect.y, 0);
            rect.width  = Math.min(rect.width,  this.photo.naturalWidth  - rect.x);
            rect.height = Math.min(rect.height, this.photo.naturalHeight - rect.y);
            this.ocrSetRectangle(rect);
        }
    },
    
    clearPath: function(path) {
        this.drawCtx.lineWidth = this.lineWidth;
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
    
    clearData: function() {
        this.words = [];
        this.selectedWords = [];
        this.haveWordText = false;
        this.currentTouchPaths = {};
        this.finishedTouchPaths = [];
        this.ocrTextbox.val('');
        this.bounds = _.clone(this.initialBounds);
    },
    
    alertError: function(message) {
        window.alert('Error: ' + message);
    }
});