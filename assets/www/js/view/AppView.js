window.AppView = Backbone.View.extend({
    tagName: 'li',
    className: 'app-view-li',
    
    initialize: function() {
        this.$el.data('model', this.model);
        this.template = _.template($('#app-tpl').html());
        this.listenTo(this.model, 'change', this.modify);
        this.listenTo(this.model, 'destroy', this.remove);
    },
    
    render: function() {
        this.$el.html(this.template({ name: this.model.get('name') }));
        return this;
    },
    
    // jQuery Mobile modifies the markup, so it is necessary to modify rather
    // than re-render
    modify: function() {
        this.$('.app-list-btn').html(this.model.get('name'));
    }
});