
var App = App || {};

App.Dashboard = function( name ) {
  this.name = name;
  this.datasources = {};
  this.newDatasources = [];
  this.charts = {};
  this.chartSettings = {};
};

App.Dashboard.prototype.getDatasource = function( id ) {
  return this.datasources.hasOwnProperty( id ) ? this.datasources[ id ] : null;
};

App.Dashboard.prototype.addDatasource = function( datasource ) {
  if( this.datasources.hasOwnProperty( datasource.id ) ) return;

  this.datasources[ datasource.id ] = datasource;
  this.newDatasources.push( datasource.id );
};

App.Dashboard.prototype.subscribeToNewDatasources = function() {
  var sub = this.newDatasources;
  this.newDatasources = [];
  App.Net.subscribeToDatasources( sub );
};

App.Dashboard.prototype.subscribeToAllDatasources = function() {
  var sub = [];
  for( var id in this.datasources ) sub.push( this.datasources[id] );
  App.Net.subscribeToDatasources( sub );
};

App.Dashboard.prototype.pushData = function( dsid , data ) {
  if( this.datasources.hasOwnProperty( dsid ) )
  {
    this.datasources[ dsid ].pushData( data );
  }
};

App.Dashboard.dashboards = null;
App.Dashboard.currentDashboard = null;

App.Dashboard.getDashboard = function( id ) {
  return App.Dashboard.dashboards.hasOwnProperty( id ) ? App.Dashboard.dashboards[ id ] : null;
};
