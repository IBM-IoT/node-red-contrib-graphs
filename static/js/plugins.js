
var App = App || {};

App.Plugins = ( function() {

  var chartTypes = {};
  var chartDependencies = [];

  function loadPlugins()
  {
    return $.get( "api/plugins" ).then( function( data ) {
      $( "body" ).append( data );
      return loadDependencies();
    } );
  }

  function loadDependencies()
  {
    var dependencyDeferreds = [];

    for( var i = 0; i < chartDependencies.length; i++ )
    {
      var ext = chartDependencies[i].substring( chartDependencies[i].lastIndexOf( "." ) + 1 );
      if( ext == "js" )
      {
        dependencyDeferreds.push( $.getScript( chartDependencies[i] ) );
      }
      else if( ext == "css" )
      {
        $( "head" ).append( '<link type="text/css" rel="stylesheet" href="' + chartDependencies[i] + '">' );
      }
      else
      {
        console.log( "Unknown dependency type: " + ext );
      }
    }

    return $.when.apply( $ , dependencyDeferreds );
  }

  function registerChartType( id , chart , options )
  {
    if( chartTypes.hasOwnProperty( id ) )
    {
      console.error( "Chart type " + id + " already registered." );
      return;
    }

    options = options || {};

    if( options.hasOwnProperty( "dependencies" ) &&
        $.isArray( options.dependencies ) &&
        options.dependencies.length > 0 )
    {
      // TODO: Watch out for duplicate entries
      chartDependencies = chartDependencies.concat( options.dependencies );
    }

    var plugin = {
      id : id,
      display_name : options.display_name || id,
      plugin : chart,
      chartConfig : options.chartConfig || {},
      datasourceConfig : options.datasourceConfig || {},
      disableComponentDiscovery : options.disableComponentDiscovery
    };

    chartTypes[ id ] = plugin;
  }

  function getPlugin( id )
  {
    return chartTypes.hasOwnProperty( id ) ? chartTypes[ id ] : null;
  }

  function getAllPlugins()
  {
    return chartTypes;
  }

  return {
    loadPlugins : loadPlugins,
    registerChartType : registerChartType,
    getPlugin : getPlugin,
    getAllPlugins : getAllPlugins
  };

} )();
