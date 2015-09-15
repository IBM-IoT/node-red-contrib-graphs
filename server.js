
var fs = require( "fs" );
var express = require( "express" );
var Mustache = require( "mustache" );

var plugins = require( "./plugins" );
var users = require( "./users" );
var datasources = require( "./datasources" );

function init( RED )
{
  fs.readFile( __dirname + "/template/index.mst" , function( err , data ) {
    if( err ) throw err;

    var rendered = Mustache.render( data.toString() , { baseUrl : RED.settings.get( "httpNodeRoot" ) } );
    fs.writeFile( __dirname + "/static/index.html" , rendered , function( err ) {
      if( err ) throw err;
    } );
  } );

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
