window.AppEditView = Backbone.View.extend({
    el: '#app-edit',
    
    events: {
        'pagebeforeshow'    : 'render',
        'vclick #app-submit' : 'submit'
    },
    
    initialize: function() {
        this.fields = {
            name : $('#app-name')
        };
    },
    
    render: function() {
        this.model = this.$el.data('app');
        _.each(this.fields, function(field, key) {
            field.val(this.model.get(key));
        }, this);
        return this;
    },
    
    submit: function() {
        _.each(this.fields, function(field, key) {
            console.log('each', {field: field, key: key});
            this.model.set(key, field.val());
        }, this);
        console.log('submit', this.model);
        //this.model.save();
    }
});