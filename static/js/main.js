
var App = App || {};

App.Main = ( function() {

  function init()
  {
    var dfd = $.Deferred();

    for( var i in App.Controller )
      App.Controller[i].init();

    App.View.Status.set( "Loading plugins..." );
    App.Plugins.loadPlugins().done( function() {
      App.View.Status.set( "Fetching datasources..." );
      App.Model.Datasource.getDatasources().done( function() {
        App.View.Status.set( "Fetching settings..." );
        App.Settings.loadSettings().done( function() {
          App.View.Status.clear();
          dfd.resolve();
        } );
      } );
    } ).fail( function() {
      $( "#dashboardListPage" ).append( '<div class="alert alert-danger">Error loading plugins.</div>' );
      dfd.resolve();
    } );

    return dfd.promise();
  }

  return {
    init : init
  };

} )();

$( window ).on( "resize" , function( event ) {
  if( event.target === window ) $( "#gridList" ).gridList( "resize" );
} );

$( document ).on( "ready" , function() {

  App.Main.init().done( function() {
    App.Page.init();
  } );

} );
