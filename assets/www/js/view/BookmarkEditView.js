window.BookmarkEditView = Backbone.View.extend({
    el: '#bm-edit',
    
    events: {
        'pagebeforeshow'    : 'render',
        'vclick #bm-submit' : 'submit'
    },
    
    initialize: function() {
        this.fields = {
            app     : $('#bm-app'),
            patient : $('#bm-patient'),
            mrn     : $('#bm-mrn'),
            acc     : $('#bm-acc')
        };
    },
    
    render: function() {
        this.model = this.$el.data('bookmark');
        _.each(this.fields, function(field, key) {
            field.val(this.model.get(key));
        }, this);
        return this;
    },
    
    submit: function() {
        this.model.set({
            app     : $('#bm-app').val(),
            patient : $('#bm-patient').val(),
            mrn     : $('#bm-mrn').val(),
            acc     : $('#bm-acc').val()
        });
        this.model.save();
    }
});