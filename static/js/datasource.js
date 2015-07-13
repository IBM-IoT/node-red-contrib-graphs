
var App = App || {};

App.Datasource = function( id ) {
  this.id = id;
  this.charts = [];
  this.end = null;
};

App.Datasource.prototype.pushData = function( data ) {
  for( var i = 0; i < this.charts.length; i++ )
  {
    this.charts[i].chart.pushData( this.charts[i].index , data );
  }
};

App.Datasource.prototype.requestHistoryData = function( start , end ) {
  if( this.end !== null )
  {
    if( end >= this.end ) return;
    if( start > this.end ) start = this.end;
  }

  this.end = end;
  App.Main.requestHistoryData( this.id , start , end );
};
