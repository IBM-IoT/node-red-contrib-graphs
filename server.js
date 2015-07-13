
var express = require( "express" );

function init( RED )
{
  RED.log.info( "Dashboard up and running" );
  RED.httpNode.use( "/dash" , express.static( __dirname + "/static" ) );
}

module.exports = {
  init : init
};
