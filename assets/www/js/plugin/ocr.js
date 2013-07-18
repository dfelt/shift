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
    
    var pageIteratorLevel = {
        RIL_BLOCK:    0,
        RIL_PARA:     1,
        RIL_TEXTLINE: 2,
        RIL_WORD:     3,
        RIL_SYMBOL:   4
    };
    
    var act = function(action) {
        return function(onSuccess, onFailure) {
            var extraArgs = Array.prototype.slice.call(arguments, 2);
            exec(onSuccess, onFailure, 'Ocr', action, extraArgs);
        };
    };
    
    module.exports = {
        PageSegMode              : pageSegMode,
        PageIteratorLevel        : pageIteratorLevel,
        
        VAR_CHAR_WHITELIST       : 'tessedit_char_whitelist',
        VAR_CHAR_BLACKLIST       : 'tessedit_char_blacklist',
        
        init                     : act('init'),
        getInitLanguagesAsString : act('getInitLanguagesAsString'),
        clear                    : act('clear'),
        end                      : act('end'),
        setVariable              : act('setVariable'),
        setPageSegMode           : act('setPageSegMode'),
        setRectangle             : act('setRectangle'),
        setImage                 : act('setImage'),
        getUTF8Text              : act('getUTF8Text'),
        meanConfidence           : act('meanConfidence'),
        wordConfidences          : act('wordConfidences'),
        getRegions               : act('getRegions'),
        getTextlines             : act('getTextlines'),
        getStrips                : act('getStrips'),
        getWords                 : act('getWords'),
        getCharacters            : act('getCharacters'),
        getResults               : act('getResults')
    };
});