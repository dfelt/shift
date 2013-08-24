
$(document).on('deviceready', function() {
    // Create and fetch collections
    var bookmarks = new BookmarkCollection();
    var apps = new AppCollection();
    _.defer(function() {
        bookmarks.fetch();
        apps.fetch();
    });
    
    // Create views, which attach listeners on initialization
    new ScanPageView();
    new ScanResultsView({ apps: apps });
    new OcrOptionsView();
    new OcrPageView({ bookmarks: bookmarks });
    new BookmarksPageView({ collection: bookmarks });
    new BookmarkEditView();
    new AppPageView({ collection: apps });
    new AppEditView();
    new SettingsPageView();
    new SettingsDialogView();
});