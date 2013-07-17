window.ScanResultsView = Backbone.View.extend({
    el: '#scan-results',
    
    events: {
        'pagebeforeshow' : 'render',
        'change input,select' : 'update',
        'vclick #scan-launch-btn' : 'launchApp',
        'vclick #scan-bookmark-btn' : 'bookmark'
    },
    
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
        var selectedIndex = select.attr('selectedIndex') || 0;
        select.empty();
        this.apps.each(function(app) {
            select.append('<option>' + app.get('name') + '</option>');
        }, this);
        select.append('<option>New...</option>');
        select.children().eq(selectedIndex).attr('selected', true);
        select.selectmenu('refresh');
        
        var self = this;
        select.on('change', function() {
            if (select.val() === 'New...') {
                var model = new App();
                self.listenTo(model, 'change', function() {
                    self.apps.add(model);
                    model.save();
                    // Select the newly added option
                    select.children().eq(-2).attr('selected', true);
                    self.renderApps();
                });
                $('#app-edit').data('app', model);
                $.mobile.changePage('#app-edit', {role: 'dialog'});
            }
        });
    },
    
    update: function(evt) {
        var field = $(evt.target);
        var key = field.attr('id').replace('scan-', '');
        this.model.set(key, field.val());
    },
    
    launchApp: function() {
        console.log('launching: ' + this.fields.app.val());
    },
    
    bookmark: function() {
        $('#bookmarks').trigger('addBookmark', this.model);
        window.alert('Successfully added bookmark.');
    }
});