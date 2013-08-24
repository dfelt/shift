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
        var currEmail = localStorage.getItem(SettingsPageView.EMAIL);
        this.showSettingsDialog('Email', currEmail, function(success, email) {
            console.log('setting email: ' + success + ' ' + email);
            if (success) { localStorage.setItem(SettingsPageView.EMAIL, email); }
        });
    },
    
    setUrl: function() {
        var currUrl = localStorage.getItem(SettingsPageView.URL);
        this.showSettingsDialog('Server URL', currUrl, function(success, url) {
            if (success) { localStorage.setItem(SettingsPageView.URL, url); }
        });
    },
    
    setSync: function() {
        // TODO: actually sync with server
        console.log('Syncing with server');
    },
    
    showSettingsDialog: function(field, initialValue, callback) {
        this.$settingsDialog.data({
            field: field,
            initialValue: initialValue,
            callback: callback });
    }
}, /* Static members */ {
    EMAIL: 'settings-email-address',
    URL: 'settings-server-url'
});