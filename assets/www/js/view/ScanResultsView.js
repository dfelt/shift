window.ScanResultsView = Backbone.View.extend({
    el: '#scan-results',
    
    events: {
        'pagebeforeshow' : 'render',
        'change input,select' : 'update',
        'touchstart #scan-app' : 'renderApps',
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
        
        this.apps.fetch();
        this.fields.app.empty();
        this.apps.each(function(app) {
            this.fields.app.append('<option>' + app.get('name') + '</option>');
        }, this);
    },
    
    renderApps: function() {
    },
    
    update: function(evt) {
        console.log('update');
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