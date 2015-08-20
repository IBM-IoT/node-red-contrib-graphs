
var App = App || {};

App.Settings = ( function() {

  function loadSettings()
  {
    var dfd = $.Deferred();

    $.getJSON( "api/user/settings" ).done( function( data , status , xhr ) {
      if( data.hasOwnProperty( "dashboards" ) ) App.Model.Dashboard.unserializeAll( data.dashboards );
      dfd.resolve();
    } );

    return dfd.promise();
  }

  function saveSettings()
  {
    var settings = {};
    settings.dashboards = App.Model.Dashboard.serializeAll();

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
