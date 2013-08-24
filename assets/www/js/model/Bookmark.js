window.Bookmark = Backbone.Model.extend({
    defaults: {
        patient: '',
        mrn: '',
        acc: ''
    }
});

window.BookmarkCollection = Backbone.Collection.extend({
    model: Bookmark,
    localStorage: new Backbone.LocalStorage('Bookmark2')
});