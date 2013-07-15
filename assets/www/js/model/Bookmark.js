window.Bookmark = Backbone.Model.extend({
    defaults: {
        app: '',
        patient: '',
        mrn: '',
        acc: ''
    }
});

window.BookmarkCollection = Backbone.Collection.extend({
    model: Bookmark,
    localStorage: new Backbone.LocalStorage('Bookmark')
});