
var express = require( "express" );
var plugins = require( "./plugins" );
var users = require( "./users" );
var datasources = require( "./datasources" );

function init( RED )
{
  RED.log.info( "Dashboard up and running" );
  RED.httpNode.use( "/dash" , express.static( __dirname + "/static" ) );

  plugins.init();
  RED.httpNode.use( "/dash/api/plugins" , plugins.app );

  users.init();
  RED.httpNode.use( "/dash/api/user" , users.app );

  datasources.init( RED );
  RED.httpNode.use( "/dash/api/datasources" , datasources.app );

  RED.httpNode.get( "/dash/*" , function( request , response ) {
    response.sendfile( __dirname + "/static/index.html" );
  } );
}

module.exports = {
  init : init
};
