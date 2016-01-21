
var express = require( "express" );
var WebSocketServer = require( "ws" ).Server;
var util = require( "util" );
var RED = null;

var wsServer = null;

var app = express();

function init( _RED )
{
  RED = _RED;

  app.get( "/" , function( request , response ) {

    var data = {};

    RED.nodes.eachNode( function( nodeObj ) {
      if( nodeObj.type == "iot-datasource" )
      {
        var node = RED.nodes.getNode( nodeObj.id );
        if( !node ) return;

        data[ nodeObj.id ] = node.getDatasourceConfig();
      }
    } );

    response.setHeader( "Content-Type" , "application/json" );
    response.end( JSON.stringify( data ) );

  } );

  app.get( "/history" , function( request , response ) {

    var error = false;

    try
    {
      if( !request.query.hasOwnProperty( "start" ) ||
          !request.query.hasOwnProperty( "end" ) ||
          !request.query.hasOwnProperty( "id" ) )
      {
        throw 1;
      }

      var start = parseInt( request.query.start );
      var end = parseInt( request.query.end );
      if( isNaN( start ) || isNaN( end ) ) throw 1;

      var node = RED.nodes.getNode( request.query.id );
      if( !node ) throw 1;

      node.handleHistoryRequest( response , start , end );
    }
    catch( e )
    {
      error = true;
    }

    if( error ) response.status( 400 ).end();

  } );

  wsServer = new WebSocketServer( {
    server : RED.server,
    path : "/dash/dsws",
  } );

  wsServer.on( "connection" , handleWSConnection );
}

function handleWSConnection( ws )
{
  ws.on( "message" , function( msg ) {
    try
    {
      msg = JSON.parse( msg );
    }
    catch( e )
    {
      console.log( e.message );
      return;
    }

    if( !msg.hasOwnProperty( "m" ) ) return;

    var node, i;
    if( msg.m == "sub" )
    {
      if( !util.isArray( msg.id ) ) msg.id = [ msg.id ];
      for( i = 0; i < msg.id.length; i++ )
      {
        node = RED.nodes.getNode( msg.id[i] );
        if( node )
        {
          node.addClient( { ws : ws } );
        }
      }
    }
    else if( msg.m == "unsub" )
    {
      if( !util.isArray( msg.id ) ) msg.id = [ msg.id ];
      for( i = 0; i < msg.id.length; i++ )
      {
        node = RED.nodes.getNode( msg.id[i] );
        if( node )
        {
          node.removeClient( ws );
        }
      }
    }
    else if( msg.m == "hist" )
    {
      node = RED.nodes.getNode( msg.dsid );
      if( node )
      {
        node.handleHistoryRequest( ws , msg.cid , msg.start , msg.end );
      }
    }

  } );

  ws.on( "close" , function( code , message ) {
    if( code != 1000 && code != 1001 )
    {
      console.log( "WS Connection closed (" + code + ( message ? ", " + message : "" ) + ")" );
    }
  } );

  ws.on( "error" , function( err ) {
    console.log( "WS Error:", err );
  } );
}

module.exports = {
  app : app,

  init : init
};
