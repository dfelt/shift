window.BookmarkView = Backbone.View.extend({
    tagName: 'li',
    
    events: {
        'vclick .bm-options-btn' : 'setOptionsModel'
    },
    
    template: _.template('<a href="#" class="bm-list-btn"><%= app %></a><a href="#bm-options" class="bm-options-btn" data-rel="popup">'),
    
    initialize: function() {
        this.listenTo(this.model, 'change', this.modify);
        this.listenTo(this.model, 'destroy', this.remove);
    },
    
    render: function() {
        this.$el.html(this.template({ app: this.model.get('app') }));
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