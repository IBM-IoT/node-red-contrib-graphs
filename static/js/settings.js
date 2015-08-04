
var App = App || {};

App.Settings = ( function() {

  function parseSettings( s )
  {
    var dashboards = [];

    if( s.hasOwnProperty( "dashboards" ) && $.isArray( s.dashboards ) )
    {
      for( var i = 0; i < s.dashboards.length; i++ )
      {
        var dashData = s.dashboards[i];
        var dashboard = new App.Dashboard( dashData.name );
        dashboard.chartSettings = dashData.charts;

        dashboards.push( dashboard );
      }
    }

    return dashboards;
  }

  function loadSettings()
  {
    var dfd = $.Deferred();

    $.getJSON( "api/user/settings" ).done( function( data , status , xhr ) {
      App.Dashboard.dashboards = parseSettings( data );
      dfd.resolve();
    } );

    return dfd.promise();
  }

  function saveSettings()
  {
    var settings = {};
    settings.dashboards = [];
    var i;

    for( i = 0; i < App.Dashboard.dashboards.length; i++ )
    {
      settings.dashboards.push( App.Dashboard.dashboards[i].serialize() );
    }

    $.ajax( {
      method : "POST",
      url : "api/user/settings",
      data : JSON.stringify( settings ),
      contentType : "text/plain"
    } ).done( function( data ) {
      if( data != "ok" )
      {
        console.error( "Error saving settings: " + data );
      }
    } );
  }

  return {
    loadSettings : loadSettings,
    saveSettings : saveSettings
  };

} )();
