
var App = App || {};

App.Net = ( function() {

  var ws = null;

  function createConnection()
  {
    var dfd = $.Deferred();

    ws = new WebSocket( ( location.protocol == "https:" ? "wss" : "ws" ) + "://" + location.host + "/dash/dsws" );

    ws.onopen = function( event ) {
      App.View.Status.setConnected( true );
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
        App.Controller.Dashboard.onNetworkDisconnect();
      }

      App.View.Status.setConnected( false );
    };

    ws.onerror = function( event ) {
      console.log( "Error" , event );
      ws = null;
      App.View.Status.setConnected( false );
    };

    return dfd.promise();
  }

  function closeConnection()
  {
    ws.onclose = null;
    ws.close();
    ws = null;
    App.View.Status.setConnected( false );
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

  function requestHistoryData( dsid , cid , start , end )
  {
    if( ws === null ) return;
    ws.send( JSON.stringify( { m : "hist" , dsid : dsid , cid : cid , start : start , end : end } ) );
  }

  return {
    createConnection : createConnection,
    closeConnection : closeConnection,
    subscribeToDatasources : subscribeToDatasources,
    unsubscribeFromDatasources : unsubscribeFromDatasources,
    requestHistoryData : requestHistoryData
  };

} )();
