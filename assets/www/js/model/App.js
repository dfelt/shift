window.App = Backbone.Model.extend({
    defaults: {
        name: ''
    }
});

window.AppCollection = Backbone.Collection.extend({
    model: App,
    localStorage: new Backbone.LocalStorage('App')
});