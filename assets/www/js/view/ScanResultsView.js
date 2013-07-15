window.ScanResultsView = Backbone.View.extend({
    el: '#scan-results',
    
    events: {
        'pagebeforeshow' : 'render',
        'change input' : 'update',
        'vclick #scan-launch-btn' : 'launchApp',
        'vclick #scan-bookmark-btn' : 'bookmark'
    },
    
    initialize: function() {
        this.fields = {
            app     : $('#scan-app'),
            patient : $('#scan-patient'),
            mrn     : $('#scan-mrn'),
            acc     : $('#scan-acc')
        };
    },
    
    // Fill in fields with scan data
    render: function() {
        console.log('rendering');
        var data = $.parseParams(this.$el.data('results'));
        this.model = new Bookmark(data);
        _.each(this.fields, function(field, key) {
            field.val(this.get(key));
        }, this.model);
    },
    
    update: function(evt) {
        var field = $(evt.target);
        var key = field.attr('id').replace('scan-', '');
        console.log('update', {evt: evt, field: field, key: key});
        this.model.set(key, field.val());
    },
    
    launchApp: function() {
        console.log('launching: ' + this.fields.app.val());
    },
    
    bookmark: function() {
        console.log('bookmark: ', this.model);
        $('#bookmarks').trigger('addBookmark', this.model);
    }
});