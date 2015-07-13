
var App = App || {};

App.Dashboard = function( name ) {
  this.name = name;
  this.datasources = {};
  this.charts = {};
  this.chartSettings = {};
};

App.Dashboard.prototype.pushData = function( dsid , data ) {
  if( this.datasources.hasOwnProperty( dsid ) )
  {
    this.datasources[ dsid ].pushData( data );
  }
};
