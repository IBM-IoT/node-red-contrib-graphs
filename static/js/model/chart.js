
var App = App || {};
App.Model = App.Model || {};

App.Model.Chart = ( function() {

  var ChartDatasource = function( parent , datasource , config )
  {
    this.parent = parent;
    this.datasource = datasource;
    this.config = config;
    this.components = [];
  };

  ChartDatasource.prototype.loadComponents = function()
  {
    this.components = [];
    var cconfig, i;
    if( this.datasource.dataComponents && !this.parent.plugin.disableComponentDiscovery )
    {
      for( i = 0; i < this.datasource.dataComponents.length; i++ )
      {
        if( this.config.components.hasOwnProperty( this.datasource.dataComponents[i] ) )
        {
          cconfig = this.config.components[ this.datasource.dataComponents[i] ];
        }
        else
        {
          cconfig = {
            enabled : true
          };
        }

        if( !cconfig.enabled ) continue;
        this.components.push( new ChartDatasourceComponent( this , this.datasource.dataComponents[i] , cconfig ) );
      }
    }
    else
    {
      cconfig = {
        enabled : true,
        label : this.config.label
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
    this.config = {
      enabled : config.enabled,
      label : config.label
    };

    if( !this.config.label ) this.config.label = this.component;
  };

  ChartDatasourceComponent.prototype.getData = function( data )
  {
    return this.component ? data[ this.component ] : data;
  };

  var Chart = function( data )
  {
    this.$container = null;

    this.pluginInstance = null;
    this.resetDatasources();

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

    this.plugin_id = data.plugin;
    this.plugin = App.Plugins.getPlugin( this.plugin_id );

    this.datasources = [];
    for( var i in data.datasources )
    {
      var datasource = App.Model.Datasource.getDatasource( data.datasources[i].id );
      if( !datasource ) continue;

      this.addDatasource( datasource , data.datasources[i].config );
    }
  };

  Chart.prototype.resetDatasources = function() {
    this.datasources = [];
    this.datasourceMap = {};
    this.unreadyDatasources = [];
  };

  Chart.prototype.addDatasource = function( datasource , config )
  {
    var index = this.datasources.length;

    if( !datasource.isReady() && this.plugin && !this.plugin.disableComponentDiscovery ) this.unreadyDatasources.push( datasource );

    var chartDatasource = new ChartDatasource( this , datasource , config );
    this.datasources.push( chartDatasource );
    this.datasourceMap[ datasource.id ] = this.datasources[ index ];
  };

  Chart.prototype.loadDatasourceComponents = function()
  {
    this.labelConflicts = {
      labels : [],
      conflicts : [],
      counts : []
    };

    this.components = [];
    for( var j = 0; j < this.datasources.length; j++ )
    {
      var chartDatasource = this.datasources[j];
      chartDatasource.componentsIndex = this.components.length;
      chartDatasource.loadComponents();

      for( var i = 0; i < chartDatasource.components.length; i++ )
      {
        var label = chartDatasource.components[i].config.label;

        var cindex = this.labelConflicts.conflicts.indexOf( label );
        if( cindex != -1 )
        {
          this.labelConflicts.counts[ cindex ]++;
        }
        else if( this.labelConflicts.labels.indexOf( label ) != -1 )
        {
          cindex = this.labelConflicts.counts.length;
          this.labelConflicts.conflicts.push( label );
          this.labelConflicts.counts.push( 2 );
        }

        if( cindex != -1 )
        {
          chartDatasource.components[i].config.label = label + "_" + this.labelConflicts.counts[ cindex ];
        }

        this.components.push( chartDatasource.components[i] );
        this.labelConflicts.labels.push( chartDatasource.components[i].config.label );
      }
    }
  };

  Chart.prototype.datasourceConfigChanged = function( datasource )
  {
    var index = this.unreadyDatasources.indexOf( datasource );
    if( datasource.isReady() && index != -1 )
    {
      this.unreadyDatasources.splice( index , 1 );
      if( this.$container ) this.load( this.$container );
    }
    else if( !datasource.isReady() && index == -1 && this.plugin && !this.plugin.disableComponentDiscovery  )
    {
      this.unreadyDatasources.push( datasource );
      if( this.$container )
      {
        if( this.pluginInstance )
        {
          this.pluginInstance = null;
          this.$container.empty();
        }
        this.load( this.$container );
      }
    }
  };

  Chart.prototype.load = function( $container )
  {
    this.$container = $container;

    if( !this.plugin )
    {
      App.View.Dashboard.showMissingPlugin( $container , this.plugin_id );
      return;
    }

    if( this.unreadyDatasources.length )
    {
      App.View.Dashboard.showPendingDatasources( $container , this.unreadyDatasources );
      return;
    }

    this.loadDatasourceComponents();

    $container.empty();
    this.pluginInstance = new this.plugin.plugin( $container[0] , this.datasources , this.components , this.config );
  };

  Chart.prototype.unload = function()
  {
    this.$container = null;
    this.pluginInstance = null;
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
