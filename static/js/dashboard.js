
var App = App || {};

App.Dashboard = function( name ) {
  this.name = name;
  this.datasources = {};
  this.newDatasources = [];
  this.chartSettings = {};
  this.charts = {};
};

App.Dashboard.prototype.getDatasource = function( id ) {
  return this.datasources.hasOwnProperty( id ) ? this.datasources[ id ] : null;
};

App.Dashboard.prototype.addDatasource = function( datasource ) {
  if( this.datasources.hasOwnProperty( datasource.id ) ) return;

  this.datasources[ datasource.id ] = datasource;
  this.newDatasources.push( datasource.id );
};

App.Dashboard.prototype.removeChart = function( id ) {
  delete this.charts[ id ];
  delete this.chartSettings[ id ];

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

  if( unsub.length > 0 )
  {
    App.Net.unsubscribeFromDatasources( unsub );
  }
};

App.Dashboard.prototype.subscribeToNewDatasources = function() {
  if( this.newDatasources.length < 1 ) return;

  var sub = this.newDatasources;
  this.newDatasources = [];
  App.Net.subscribeToDatasources( sub );
};

App.Dashboard.prototype.subscribeToAllDatasources = function() {
  var sub = [];
  for( var id in this.datasources ) sub.push( id );
  App.Net.subscribeToDatasources( sub );
};

App.Dashboard.prototype.pushData = function( dsid , data ) {
  if( this.datasources.hasOwnProperty( dsid ) )
  {
    this.datasources[ dsid ].pushData( data );
  }
};

App.Dashboard.prototype.serialize = function() {
  var data = {
    name : this.name,
    charts : this.chartSettings
  };

  return data;
};

App.Dashboard.dashboards = null;
App.Dashboard.currentDashboard = null;

App.Dashboard.getDashboard = function( id ) {
  return App.Dashboard.dashboards.hasOwnProperty( id ) ? App.Dashboard.dashboards[ id ] : null;
};
