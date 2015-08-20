
var App = App || {};

App.Main = ( function() {

  function init()
  {
    App.Plugins.loadPlugins().done( function() {
      App.Model.Datasource.getDatasources().done( function() {
        App.Settings.loadSettings().done( function() {
          App.View.DashboardList.render( App.Model.Dashboard.dashboards );
        } );
      } );
    } ).fail( function() {
      $( "#dashboardListPage" ).append( '<div class="alert alert-danger">Error loading plugins.</div>' );
    } ).always( function() {
      App.Page.navigateTo( "#dashboardListPage" );
    } );
  }

  return {
    init : init
  };

} )();

$( window ).on( "resize" , function( event ) {
  if( event.target === window ) $( "#gridList" ).gridList( "resize" );
} );

$( document ).on( "ready" , function() {

  App.Main.init();

  for( var i in App.Controller )
    App.Controller[i].init();

} );
