
var App = App || {};

App.Main = ( function() {

  function init()
  {
    App.Plugins.loadPlugins().done( function() {
      $.when( $.getJSON( "api/datasources" ) , App.Settings.loadSettings() ).done( function( _datasources , _settings ) {

        App.Datasource.datasources = _datasources[0];
        App.Dashboard.dashboards = _settings;
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

$( window ).on( "resize" , function() {
  $( "#gridList" ).gridList( "resize" );
} );

$( document ).on( "ready" , function() {

  App.Main.init();

  App.Pages.Dashboards.init();
  App.Pages.Charts.init();

} );
