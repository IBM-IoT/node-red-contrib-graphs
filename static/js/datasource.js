
var App = App || {};

App.Datasource = function( id ) {
  this.id = id;
  this.chartCount = 0;
  this.charts = {};
  this.end = null;
};

App.Datasource.prototype.addChart = function( id , index , chart ) {
  if( this.charts.hasOwnProperty( id ) )
  {
    console.error( "Datasource already has chart: " + id );
    return;
  }

  this.charts[ id ] = {
    index : index,
    chart : chart
  };

  this.chartCount++;
};

App.Datasource.prototype.removeChart = function( id ) {
  if( this.charts.hasOwnProperty( id ) )
  {
    delete this.charts[ id ];
    this.chartCount--;
  }
};

App.Datasource.prototype.isEmpty = function() {
  return this.chartCount === 0;
};

App.Datasource.prototype.pushData = function( data ) {
  for( var id in this.charts )
  {
    this.charts[id].chart.pushData( this.charts[id].index , data );
  }
};

// TODO: Flip start and end properly
App.Datasource.prototype.requestHistoryData = function( end , start ) {
  if( this.end !== null )
  {
    if( end >= this.end ) return;
    if( start > this.end ) start = this.end;
  }

  this.end = end;
  App.Net.requestHistoryData( this.id , start , end );
};

App.Datasource.getDatasources = function() {
  var dfd = $.Deferred();

  $.getJSON( "api/datasources" ).done( function( datasources ) {
    App.Datasource.datasources = datasources;
    dfd.resolve();
  } );

  return dfd.promise();
};

App.Datasource.datasources = null;
