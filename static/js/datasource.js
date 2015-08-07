
var App = App || {};

App.Datasource = function( id ) {
  this.config = App.Datasource.datasources[ id ];
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

App.Datasource.prototype.convertData = function( data ) {
  if( this.config.tstampField )
  {
    data.tstamp = data[ this.config.tstampField ];
    delete data[ this.config.tstampField ];
  }

  if( this.config.dataField )
  {
    data.data = data[ this.config.dataField ];
    delete data[ this.config.dataField ];
  }

  return data;
};

App.Datasource.prototype.pushData = function( data ) {
  data = this.convertData( data );

  for( var id in this.charts )
  {
    this.charts[id].chart.pushData( this.charts[id].index , data );
  }
};

App.Datasource.prototype.requestHistoryData = function( index , start , end , callback ) {
  var self = this;

  $.getJSON( "api/datasources/history?id=" + this.id + "&start=" + start + "&end=" + end ).done( function( data ) {
    if( self.config.tstampField || self.config.dataField )
    {
      for( var i = 0; i < data.length; i++ )
        data[i] = self.convertData( data[i] );
    }

    if( typeof callback === "function" ) callback( index , data );
  } );
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
