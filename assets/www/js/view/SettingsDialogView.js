window.SettingsDialogView = Backbone.View.extend({
    el: '#set-dialog',
    
    events: {
        'pagebeforeshow'     : 'render',
        'vclick #set-submit' : 'submit',
        'vclick #set-cancel' : 'cancel',
        'vclick #set-dialog-header > a' : 'cancel'
    },
    
    render: function() {
        this.$('label').html(this.$el.data('field') + ':');
        this.$('input').val(this.$el.data('initialValue'));
        this.callback = this.$el.data('callback');
    },
    
    submit: function() {
        this.callback(true, this.$('input').val());
    },
    
    cancel: function() {
        this.callback(false);
    }
});