window.BookmarkView = Backbone.View.extend({
    tagName: 'li',
    
    events: {
        'vclick .bm-options-btn' : 'setOptionsModel'
    },
    
    // Lazily instantiate template
    template: function(data) {
        if (!this.tpl) {
            window.BookmarkView.prototype.tpl = _.template($('#bm-tpl').html());
        }
        return this.tpl(data);
    },
    
    initialize: function() {
        this.listenTo(this.model, 'change', this.modify);
        this.listenTo(this.model, 'destroy', this.remove);
    },
    
    render: function() {
        this.$el.html(this.template({ patient: this.model.get('patient') }));
        return this;
    },
    
    // jQuery Mobile modifies the markup, so it is necessary to modify rather
    // than re-render
    modify: function() {
        this.$('.bm-list-btn').html(this.model.get('app'));
    },
    
    setOptionsModel: function() {
        $('#bm-options').data('bookmark', this.model);
    }
});