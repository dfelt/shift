window.AppPageView = Backbone.View.extend({
    el: '#app',
    
    events: {
        'pagebeforeshow'          : 'render',
        'vclick #app-new-btn'     : 'addNew',
        'vclick #app-edit-btn'    : 'edit',
        'vclick #app-remove-btn'  : 'remove',
        'vclick .app-view-li'     : 'select'
    },
    
    initialize: function() {
        this.$appList = $('#app-list');
        this.$options = $('#app-options');
        
        this.listenTo(this.collection, 'add', this.showApp);
        this.listenTo(this.collection, 'reset', this.reset);
        this.listenTo(this.collection, 'change', this.render);
    },

    // Debounce listview refresh so ui updates are grouped
    render: _.debounce(function() {
        if (this.$appList.hasClass('ui-listview')) {
            this.$appList.listview('refresh');
        }
    }, 100),
    
    showApp: function(app) {
        var view = new AppView({ model: app });
        this.$appList.append(view.render().el);
        this.render();
    },
    
    reset: function() {
        this.$appList.empty();
        this.collection.each(this.add, this);
    },
    
    edit: function() {
        $('#app-edit').data('app', this.selected);
    },
    
    addNew: function() {
        var model = new App();
        $('#app-edit').data('app', model);
        this.listenTo(model, 'change', function() {
            this.collection.add(model);
            model.save();
        });
    },
    
    remove: function() {
        this.selected.destroy();
        this.render();
    },
    
    select: function(evt) {
        this.selected = $(evt.currentTarget).data('model');
    }
});