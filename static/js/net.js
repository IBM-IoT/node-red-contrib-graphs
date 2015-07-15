
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
        if( App.Dashboard.currentDashboard !== null )
        {
          for( var dsid in data )
          {
            App.Dashboard.currentDashboard.pushData( dsid , data[ dsid ] );
          }
        }
      }
    };

    ws.onclose = function( event ) {
      console.log( "Close" , event );
      ws = null;
      if( event.code === 1000 )
      {
        createConnection().done( function() {
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

  function requestHistoryData( id , start , end )
  {
    if( ws === null ) return;

    var msg = {
      m : "history",
      id : id,
      start : start,
      end : end
    };

    ws.send( JSON.stringify( msg ) );
  }

  return {
    createConnection : createConnection,
    subscribeToDatasources : subscribeToDatasources,
    requestHistoryData : requestHistoryData
  };

} )();
