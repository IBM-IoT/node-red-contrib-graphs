
var express = require( "express" );
var fs = require( "fs" );

var app = express();

var pluginFiles = [];
var dashPluginData = "";

function init()
{
  app.get( "/" , function( request , response ) {
    dashPluginData = loadPlugins( pluginFiles );
    response.setHeader( "Content-Type" , "text/html" );
    response.end( dashPluginData );
  } );

  pluginFiles = loadPluginFiles();
}

function loadPluginFiles()
{
  var pluginFiles = [];

  searchDirs = [ __dirname + "/plugins/" ];
  while( searchDirs.length > 0 )
  {
    var dir = searchDirs.shift();
    // console.log( "Searching: " + dir );

    var files = fs.readdirSync( dir );
    for( var i in files )
    {
      var file = dir + files[i];
      if( fs.statSync( file ).isDirectory() )
      {
        searchDirs.push( file + "/" );
        continue;
      }

      if( file.substring( file.length - 5 ) == ".html" )
      {
        pluginFiles.push( file );
        // console.log( "Added plugin: " + file );
      }
    }
  }

  return pluginFiles;
}

function loadPlugins( fileList )
{
  var data = "";

  for( var i = 0; i < fileList.length; i++ )
  {
    try
    {
      data += fs.readFileSync( fileList[i] );
    }
    catch( e )
    {
      console.log( "Unable to read " + fileList[i] + ": " + e.message );
    }
  }

  return data;
}

module.exports = {
  app : app,

  init : init
};
