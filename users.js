
var libURL = require( "url" );
var fs = require( "fs" );
var express = require( "express" );

var app = express();

var settings = {};
var cfgDir;

function init()
{
  cfgDir = __dirname + "/.dash";

  try
  {
    fs.mkdirSync( cfgDir );
  }
  catch( e )
  {
    if( e.code != "EEXIST" )
    {
      console.error( "Unable to create .dash dir in " + __dirname );
    }
  }

  app.get( "/settings" , function( request , response ) {

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
