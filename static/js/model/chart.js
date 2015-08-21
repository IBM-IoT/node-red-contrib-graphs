
var App = App || {};
App.Model = App.Model || {};

App.Model.Chart = ( function() {

  var Chart = function( data )
  {
    this.pluginInstance = null;
    this.datasourceMap = {};

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

    this.datasources.push( {
      datasource : datasource,
      config : config,
      index : index
    } );

    this.datasourceMap[ datasource.id ] = this.datasources[ index ];
  };

  Chart.prototype.load = function( $container )
  {
    if( !this.plugin ) return;
    $container.empty();
    this.pluginInstance = new this.plugin.plugin( $container[0] , this.datasources , this.config );
  };

  Chart.prototype.pushData = function( datasource , data )
  {
    if( this.pluginInstance )
    {
      datasource = this.datasourceMap[ datasource.id ];
      this.pluginInstance.pushData( datasource.index , data );
    }
  };

  return Chart;

} )();
