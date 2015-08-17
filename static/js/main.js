
var App = App || {};

App.Main = ( function() {

  function init()
  {
    App.Plugins.loadPlugins().done( function() {
      $.when( App.Datasource.getDatasources() , App.Settings.loadSettings() ).done( function() {
        App.Pages.Dashboards.populateDashboardList( App.Dashboard.dashboards );
      } );
    } ).fail( function() {
      $( "#dashboardPage" ).append( '<div class="alert alert-danger">Error loading plugins.</div>' );
    } ).always( function() {
      App.Page.navigateTo( "#dashboardPage" );
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

  App.Pages.Dashboards.init();
  App.Pages.Charts.init();

} );
