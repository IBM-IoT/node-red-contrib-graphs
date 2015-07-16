
var App = App || {};

App.Main = ( function() {

  function dashButtonClick()
  {
    var id = $( this ).attr( "data-dash" );
    var dashboard = App.Dashboard.getDashboard( id );
    if( dashboard === null ) return;

    App.Net.createConnection().done( function() {
      App.Page.navigateTo( "#chartsPage" , function() {
        App.Pages.Charts.loadDashboard( dashboard );
      } );
    } );
  }

  function init()
  {
    App.Plugins.loadPlugins().done( function() {
      $.when( $.getJSON( "api/datasources" ) , App.Settings.loadSettings() ).done( function( _datasources , _settings ) {

        App.Datasource.datasources = _datasources[0];
        var dashboards = App.Dashboard.dashboards = _settings;

        var container = $( "#dashboardPage" );
        for( var i = 0; i < dashboards.length; i++ )
        {
          container.append( '<p><button type="button" class="btn btn-default" data-dash="' + i + '">' + dashboards[i].name + '</button></p>' );
        }

        container.find( "button" ).on( "click" , dashButtonClick );

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

  App.Pages.Charts.init();

} );
