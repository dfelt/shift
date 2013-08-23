window.SettingsPageView = Backbone.View.extend({
    el: '#settings',
    
    events: {
        'vclick #set-email' : 'setEmail',
        'vclick #set-url'   : 'setUrl',
        'vclick #set-sync'  : 'setSync'
    },
    
    initialize: function() {
        this.$settingsDialog = $('#set-dialog');
    },
    
    setEmail: function() {
        var key = 'settings-email-address';
        var currEmail = localStorage.getItem(key);
        this.showSettingsDialog('Email', currEmail, function(success, email) {
            console.log('setting email: ' + success + ' ' + email);
            if (success) { localStorage.setItem(key, email); }
        });
    },
    
    setUrl: function() {
        var key = 'settings-server-url';
        var currUrl = localStorage.getItem(key);
        this.showSettingsDialog('Server URL', currUrl, function(success, url) {
            if (success) { localStorage.setItem(key, url); }
        });
    },
    
    setSync: function() {
        // TODO: actually sync with server
        console.log('Syncing with server');
    },
    
    showSettingsDialog: function(field, initialValue, callback) {
        console.log('initialValue: ' + initialValue);
        this.$settingsDialog.data({
            field: field,
            initialValue: initialValue,
            callback: callback });
    }
});