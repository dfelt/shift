cordova.define('cordova/plugin/ocr', function(require, exports, module) {
    'use strict';
    
    var exec = require('cordova/exec');
    
    var pageSegMode = {
        PSM_OSD_ONLY: 0,
        PSM_AUTO_OSD: 1,
        PSM_AUTO_ONLY: 2,
        PSM_AUTO: 3,
        PSM_SINGLE_COLUMN: 4,
        PSM_SINGLE_BLOCK_VERT_TEXT: 5,
        PSM_SINGLE_BLOCK: 6,
        PSM_SINGLE_LINE: 7,
        PSM_SINGLE_WORD: 8,
        PSM_CIRCLE_WORD: 9,
        PSM_SINGLE_CHAR: 10,
        PSM_SPARSE_TEXT: 11,
        PSM_SPARSE_TEXT_OSD: 12,
        PSM_COUNT: 13
    };
    
    var charSet = {};
    charSet.LOWER     = 'abcdefghijklmnopqrstuvwxyz';
    charSet.UPPER     = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    charSet.NUM       = '0123456789';
    charSet.PUNCT     = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';
    charSet.ALPHA     = charSet.lowercase + charSet.uppercase;
    charSet.ALPHANUM  = charSet.alpha + charSet.numeric;
    
    var defaultOptions = {
        lang: null,
        pageSegMode: null,
        whiteList: null,
        blackList: null,
        rectangle: null
    };
    
    var run = function(action, imageUri, onSuccess, onFailure, options) {
        if (typeof options === 'object' && options !== null) {
            // Set values to defaults, if they don't exist
            for (var key in defaultOptions) {
                if (!(key in options)) {
                    options[key] = defaultOptions[key];
                }
            }
        } else {
            options = null;
        }
        
        exec(onSuccess, onFailure, 'Ocr', action, [imageUri, options]);
    };
    
    var act = function(action) {
        return function(imageUri, onSuccess, onFailure, options) {
            run(action, imageUri, onSuccess, onFailure, options);
        };
    };
    
    module.exports = {
        PageSegMode:  pageSegMode,
        CharSet:      charSet,
        getWordBoxes: act('getWordBoxes'),
        getText:      act('getText'),
        getWords:     act('getWords')
    };
});