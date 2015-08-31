
var App = App || {};
App.Model = App.Model || {};

App.Model.Dashboard = ( function() {

  var Dashboard = function( name ) {
    this.name = name;
    this.datasources = {};
    this.charts = {};

    this.active = false;
  };

  Dashboard.prototype.serialize = function()
  {
    var data = {
      name : this.name,
      charts : []
    };

    for( var i in this.charts )
      data.charts.push( this.charts[i].serialize() );

    return data;
  };

  Dashboard.prototype.unserialize = function( data )
  {
    this.name = data.name;
    for( var i in data.charts )
    {
      var chart = new App.Model.Chart( data.charts[i] );
      this.addChart( chart );
    }
  };

  Dashboard.prototype.load = function()
  {
    this.active = true;
    this.subscribeToAllDatasources();
  };

  Dashboard.prototype.unload = function()
  {
    this.active = false;
    for( var id in this.charts )
      this.charts[id].unload();
  };

  Dashboard.prototype.getChart = function( id )
  {
    return this.charts.hasOwnProperty( id ) ? this.charts[id] : null;
  };

  Dashboard.prototype.addChart = function( chart )
  {
    this.charts[ chart.id ] = chart;

    var sub = [];
    for( var i = 0; i < chart.datasources.length; i++ )
    {
      var datasource = chart.datasources[i].datasource;
      if( !this.datasources.hasOwnProperty( datasource.id ) )
      {
        this.datasources[ datasource.id ] = datasource;
        sub.push( datasource.id );
      }

      datasource.addChart( chart , i );
    }

    if( this.active && sub.length )
      App.Net.subscribeToDatasources( sub );
  };

  Dashboard.prototype.removeChart = function( id ) {
    if( this.active )
    {
      var unsub = [];
      for( var dsid in this.datasources )
      {
        this.datasources[ dsid ].removeChart( id );
        if( this.datasources[ dsid ].isEmpty() )
        {
          unsub.push( dsid );
          delete this.datasources[ dsid ];
        }
      }

      if( unsub.length )
        App.Net.unsubscribeFromDatasources( unsub );
    }

    // chart.unload()
    delete this.charts[ id ];
  };

  Dashboard.prototype.subscribeToAllDatasources = function() {
    var sub = [];
    for( var id in this.datasources ) sub.push( id );
    App.Net.subscribeToDatasources( sub );
  };

  Dashboard.prototype.pushData = function( data ) {
    if( !this.datasources.hasOwnProperty( data.id ) ) return;

    var datasource = this.datasources[ data.id ];
    if( data.type == "live" ) datasource.pushData( data.data );
    else if( data.type == "history" ) datasource.pushHistoryData( data.cid , data.data );
    else if( data.type == "config" ) datasource.updateConfig( data.config );
  };

  Dashboard.dashboards = [];

  Dashboard.getDashboard = function( id ) {
    return Dashboard.dashboards.hasOwnProperty( id ) ? Dashboard.dashboards[ id ] : null;
  };

  Dashboard.addDashboard = function( dashboard ) {
    Dashboard.dashboards.push( dashboard );
  };

  Dashboard.removeDashboard = function( id ) {
    Dashboard.dashboards.splice( id , 1 );
  };

  Dashboard.serializeAll = function()
  {
    var data = [];
    for( var i in Dashboard.dashboards )
      data.push( Dashboard.dashboards[i].serialize() );

    return data;
  };

  Dashboard.unserializeAll = function( data )
  {
    for( var i in data )
    {
      var dashboard = new Dashboard();
      dashboard.unserialize( data[i] );
      Dashboard.addDashboard( dashboard );
    }
  };

  return Dashboard;

} )();
