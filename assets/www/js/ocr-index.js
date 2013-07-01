/*jslint browser: true*/
/*global $, _, Backbone, cordova, window, console*/

$(document).on('deviceready', function() {
    
// channel is used to send messages between views
var channel = _.extend({}, Backbone.Events);

var homeView = new HomeView({ channel: channel });
var ocrView = new OcrView({ channel: channel });

});
