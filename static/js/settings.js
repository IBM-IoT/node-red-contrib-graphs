
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

    var settings = {};
    $.getJSON( "api/user/settings" ).done( function( data , status , xhr ) {
      settings = data;
    } ).always( function() {
      dfd.resolve( parseSettings( settings ) );
    } );

    return dfd.promise();
  }

  function saveDashboards( dashboards )
  {
    settings.dashboards = {};

    for( var dashid in dashboards )
    {
      settings.dashboards[ dashid ] = {
        charts : {}
      };
      for( var chartid in dashboards[ dashid ].charts )
      {
        settings.dashboards[ dashid ].charts[ chartid ] = dashboards[ dashid ].charts[ chartid ];
      }
    }

    $.post( "api/user/settings" , JSON.stringify( settings ) ).done( function( data ) {
      console.log( "Save Settings: " + data );
    } );
  }

  return {
    loadSettings : loadSettings,
    saveDashboards : saveDashboards
  };

} )();
