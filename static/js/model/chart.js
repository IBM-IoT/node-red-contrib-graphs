
var App = App || {};
App.Model = App.Model || {};

App.Model.Chart = ( function() {

  var ChartDatasource = function( parent , datasource , config , componentsIndex )
  {
    this.parent = parent;
    this.datasource = datasource;
    this.config = config;
    this.componentsIndex = componentsIndex;

    this.components = [];
    var cconfig, i;
    if( datasource.dataComponents )
    {
      for( i = 0; i < datasource.dataComponents.length; i++ )
      {
        cconfig = {
          label : config.label + "." + datasource.dataComponents[i]
        };
        this.components.push( new ChartDatasourceComponent( this , datasource.dataComponents[i] , cconfig ) );
      }
    }
    else
    {
      cconfig = {
        label : config.label
      };
      this.components.push( new ChartDatasourceComponent( this , null , cconfig ) );
    }
  };

  ChartDatasource.prototype.requestHistoryData = function( start , end , callback )
  {
    this.datasource.requestHistoryData( this.parent , start , end , callback );
  };

  var ChartDatasourceComponent = function( datasource , component , config )
  {
    this.datasource = datasource;
    this.component = component;
    this.config = config;
  };

  ChartDatasourceComponent.prototype.getData = function( data )
  {
    return this.component ? data[ this.component ] : data;
  };

  var Chart = function( data )
  {
    this.pluginInstance = null;
    this.datasourceMap = {};
    this.components = [];

    if( data ) this.unserialize( data );
  };

  Chart.prototype.serialize = function()
  {
    var data = {
      id : this.id,
      name : this.name,
      config : this.config,
      datasources : [],
      pos : this.pos
    };

    if( this.plugin ) data.plugin = this.plugin.id;

    for( var i in this.datasources )
    {
      data.datasources.push( {
        id : this.datasources[i].datasource.id,
        config : this.datasources[i].config
      } );
    }

    return data;
  };

  Chart.prototype.unserialize = function( data )
  {
    this.id = data.id;
    this.name = data.name;
    this.config = data.config;
    this.pos = data.pos;

    // A bit of backwards compatibility
    if( data.chartPlugin ) data.plugin = data.chartPlugin;

    this.plugin = data.plugin ? App.Plugins.getPlugin( data.plugin ) : null;

    this.datasources = [];
    for( var i in data.datasources )
    {
      var datasource = App.Model.Datasource.getDatasource( data.datasources[i].id );
      if( !datasource ) continue;

      this.addDatasource( datasource , data.datasources[i].config );
    }
  };

  Chart.prototype.addDatasource = function( datasource , config )
  {
    var index = this.datasources.length;

    var chartDatasource = new ChartDatasource( this , datasource , config , this.components.length );
    this.datasources.push( chartDatasource );

    for( var i = 0; i < chartDatasource.components.length; i++ )
      this.components.push( chartDatasource.components[i] );

    this.datasourceMap[ datasource.id ] = this.datasources[ index ];
  };

  Chart.prototype.load = function( $container )
  {
    if( !this.plugin ) return;
    $container.empty();
    this.pluginInstance = new this.plugin.plugin( $container[0] , this.datasources , this.components , this.config );
  };

  Chart.prototype.pushData = function( datasource , data , callback )
  {
    if( this.pluginInstance )
    {
      if( typeof callback != "function" ) callback = this.pluginInstance.pushData.bind( this.pluginInstance );
      datasource = this.datasourceMap[ datasource.id ];
      for( var i = 0; i < datasource.components.length; i++ )
      {
        callback( datasource.componentsIndex + i , data );
      }
    }
  };

  return Chart;

} )();
