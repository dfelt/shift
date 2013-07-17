window.ScanResultsView = Backbone.View.extend({
    el: '#scan-results',
    
    events: {
        'pagebeforeshow' : 'render',
        'change select' : 'newApp',
        'vclick #scan-launch-btn' : 'launchApp',
        'vclick #scan-bookmark-btn' : 'bookmark'
    },
    
    selectedIndex: 0,
    
    initialize: function(options) {
        this.apps = options.apps;
        this.fields = {
            app     : $('#scan-app'),
            patient : $('#scan-patient'),
            mrn     : $('#scan-mrn'),
            acc     : $('#scan-acc')
        };
    },
    
    // Fill in fields with scan data
    render: function() {
        var data = $.parseParams(this.$el.data('results'));
        console.log('Got data: ' + JSON.stringify(data));
        var model = this.model = new Bookmark(data);
        _.each(this.fields, function(field, key) {
            field.val(model.get(key));
        });
        
        this.renderApps();
    },
    
    renderApps: function() {
        var select = this.fields.app;
        select.empty();
        this.apps.each(function(app) {
            select.append('<option>' + app.get('name') + '</option>');
        }, this);
        select.append('<option>New...</option>');
        
        select.children().eq(this.selectedIndex).attr('selected', true);
        select.selectmenu('refresh');
    },
    
    newApp: function() {
        var select = this.fields.app;
        if (select.val() === 'New...') {
            var model = new App();
            this.listenToOnce(model, 'change', function() {
                this.apps.add(model);
                model.save();
                // Select the newly added option
                this.selectedIndex = this.apps.length - 1;
            });
            $('#app-edit').data('app', model);
            $.mobile.changePage('#app-edit', {role: 'dialog'});
        }
    },
    
    launchApp: function() {
        console.log('launching: ' + this.fields.app.val());
    },
    
    bookmark: function() {
        _.each(this.fields, function(field, key) {
            model.set(key, field.val());
        });
        $('#bookmarks').trigger('addBookmark', this.model);
        window.alert('Successfully added bookmark.');
    }
});