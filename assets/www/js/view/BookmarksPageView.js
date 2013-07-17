window.BookmarksPageView = Backbone.View.extend({
    el: '#bookmarks',
    
    events: {
        'pagebeforeshow'        : 'render',
        'addBookmark'           : 'addToCollection',
        'vclick #bm-new-btn'    : 'addNew',
        'vclick #bm-edit-btn'   : 'edit',
        'vclick #bm-remove-btn' : 'remove'
    },
    
    initialize: function() {
        this.$bookmarkList = $('#bm-list');
        this.$options = $('#bm-options');
        
        this.listenTo(this.collection, 'add', this.showBookmark);
        this.listenTo(this.collection, 'reset', this.reset);
        this.listenTo(this.collection, 'change', this.render);
    },

    // Debounce listview refresh so ui updates are grouped
    render: _.debounce(function() {
        if (this.$bookmarkList.hasClass('ui-listview')) {
            this.$bookmarkList.listview('refresh');
        }
    }, 100),
    
    showBookmark: function(bookmark) {
        var view = new BookmarkView({ model: bookmark });
        this.$bookmarkList.append(view.render().el);
        this.render();
    },
    
    addNew: function() {
        var model = new Bookmark();
        $('#bm-edit').data('bookmark', model);
        this.listenToOnce(model, 'change', function() {
            this.collection.add(model);
        });
    },
    
    addToCollection: function(evt, bookmark) {
        this.populate();
        this.collection.add(bookmark);
        bookmark.save();
    },
    
    reset: function() {
        this.$bookmarkList.empty();
        this.collection.each(this.showBookmark, this);
    },
    
    edit: function() {
        var model = this.$options.data('bookmark');
        $('#bm-edit').data('bookmark', model);
    },
    
    remove: function() {
        this.$options.data('bookmark').destroy();
        this.render();
    }
});