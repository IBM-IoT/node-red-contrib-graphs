
var libURL = require( "url" );
var fs = require( "fs" );
var path = require( "path" );
var express = require( "express" );

var app = express();

var settings = {};
var cfgDir;

function init( RED )
{
  var oldCfgDir = __dirname + "/.dash";
  cfgDir = path.join( RED.settings.userDir , ".dash" );

  try
  {
    fs.mkdirSync( cfgDir );
  }
  catch( e )
  {
    if( e.code != "EEXIST" )
    {
      console.error( "Unable to create .dash dir in " + __dirname );
      return;
    }
  }

  var oldCfgData = null;
  try
  {
    oldCfgData = fs.readFileSync( path.join( oldCfgDir , "config_default.json" ) );
  }
  catch( e ) {}

  if( oldCfgData )
  {
    try
    {
      fs.unlinkSync( path.join( oldCfgDir , "config_default.json" ) );
      fs.rmdirSync( oldCfgDir );
      fs.writeFileSync( getSettingsFilename( "default" ) , oldCfgData );
      RED.log.info( "Moved dashboard config to " + cfgDir );
    }
    catch( e )
    {
      console.error( "Unable to move old config file: " + e.message );
    }
  }

  app.get( "/settings" , function( request , response ) {

    response.setHeader( "Content-Type" , "application/json" );
    response.end( JSON.stringify( getSettings( "default" ) ) );

  } );

  // TODO: Not do this...
  app.post( "/settings" , function( request , response ) {

    var data = "";

    request.on( "data" , function( chunk ) {
      data += chunk;
    } );

    request.on( "end" , function() {
      try
      {
        settings.default = JSON.parse( data );
        saveSettings( "default" );
        response.end( "ok" );
      }
      catch( e )
      {
        response.end( e.message );
      }
    } );

  } );
}

function getSettings( id )
{
  if( !settings.hasOwnProperty( id ) )
  {
    var loadedSettings = loadSettings( id );
    settings[ id ] = ( loadedSettings === null ? {} : loadedSettings );
  }
  return settings[ id ];
}

function loadSettings( id )
{
  try
  {
    return JSON.parse( fs.readFileSync( getSettingsFilename( id ) ) );
  }
  catch( e )
  {
    console.log( "Unable to load settings file '" + id + "': " + e.message );
  }

  return null;
}

function saveSettings( id )
{
  if( !settings.hasOwnProperty( id ) ) return;

  try
  {
    fs.writeFileSync( getSettingsFilename( id ) , JSON.stringify( settings[ id ] , null , '\t' ) );
  }
  catch( e )
  {
    console.log( "Unable to save settings '" + id + "': " + e.message );
  }
}

function getSettingsFilename( id )
{
  return cfgDir + "/config_" + id + ".json";
}

module.exports = {
  app : app,

  init : init
};
