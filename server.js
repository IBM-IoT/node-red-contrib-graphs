
var fs = require( "fs" );
var express = require( "express" );
var Mustache = require( "mustache" );

var plugins = require( "./plugins" );
var users = require( "./users" );
var datasources = require( "./datasources" );

var app = express();
var renderedIndex = "";

function init( RED )
{
  fs.readFile( __dirname + "/template/index.mst" , function( err , data ) {
    if( err ) throw err;
    renderedIndex = Mustache.render( data.toString() , { baseUrl : RED.settings.get( "httpNodeRoot" ) } );
  } );

  RED.log.info( "Dashboard up and running" );
  app.use( "/" , express.static( __dirname + "/static" ) );

  plugins.init();
  app.use( "/api/plugins" , plugins.app );

  users.init( RED );
  app.use( "/api/user" , users.app );

  datasources.init( RED );
  app.use( "/api/datasources" , datasources.app );

  app.get( "*" , function( request , response ) {
    response.send( renderedIndex );
  } );

  RED.httpNode.use( "/dash/" , app );
}

module.exports = {
  init : init
};
