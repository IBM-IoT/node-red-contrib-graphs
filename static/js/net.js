
var App = App || {};

App.Net = ( function() {

  var ws = null;

  function createConnection()
  {
    var dfd = $.Deferred();

    ws = new WebSocket( "ws://" + location.host + location.pathname + "dsws" );

    ws.onopen = function( event ) {
      dfd.resolve();
    };

    ws.onmessage = function( event ) {
      var data = event.data;
      try
      {
        data = JSON.parse( data );
      }
      catch( e ) {} // No worries, treat data as String

      if( typeof data === "string" )
      {

      }
      else
      {
        App.Controller.Dashboard.onNetworkMessage( data );
      }
    };

    ws.onclose = function( event ) {
      console.log( "Close" , event );
      ws = null;
      if( event.code === 1000 )
      {
        createConnection().done( function() {
          App.Datasource.getDatasources();
          if( App.Dashboard.currentDashboard !== null )
          {
            App.Dashboard.currentDashboard.subscribeToAllDatasources();
          }
        } );
      }
    };

    ws.onerror = function( event ) {
      console.log( "Error" , event );
      ws = null;
    };

    return dfd.promise();
  }

  function subscribeToDatasources( datasources )
  {
    if( ws === null ) return;
    ws.send( JSON.stringify( { m : "sub" , id : datasources } ) );
  }

  function unsubscribeFromDatasources( datasources )
  {
    if( ws === null ) return;
    ws.send( JSON.stringify( { m : "unsub" , id : datasources } ) );
  }

  return {
    createConnection : createConnection,
    subscribeToDatasources : subscribeToDatasources,
    unsubscribeFromDatasources : unsubscribeFromDatasources
  };

} )();
