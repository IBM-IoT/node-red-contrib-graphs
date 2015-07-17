
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
    var nodes = RED.nodes.getFlows();

    for( var i = 0; i < nodes.length; i++ )
    {
      if( nodes[i].type == "iot-datasource" )
      {
        data[ nodes[i].id ] = {
          name : nodes[i].name
        };
      }
    }

    response.setHeader( "Content-Type" , "application/json" );
    response.end( JSON.stringify( data ) );

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
    if( msg.m == "history" )
    {
      node = RED.nodes.getNode( msg.id );
      if( node )
      {
        node.handleHistoryRequest( { ws : ws } , msg.start , msg.end );
      }
    }
    else if( msg.m == "sub" )
    {
      if( !util.isArray( msg.id ) ) msg.id = [ msg.id ];
      for( i = 0; i < msg.id.length; i++ )
      {
        node = RED.nodes.getNode( msg.id[i] );
        if( node )
        {
          node.clients.push( { ws : ws } );
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

  } );

  ws.on( "close" , function( code , message ) {
    console.log( "WS Connection closed (" + code + ( message ? ", " + message : "" ) + ")" );
  } );

  ws.on( "error" , function( err ) {
    console.log( "WS Error:", err );
  } );
}

module.exports = {
  app : app,

  init : init
};
