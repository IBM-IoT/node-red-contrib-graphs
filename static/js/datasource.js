
var App = App || {};

App.Datasource = function( id ) {
  this.config = App.Datasource.datasources[ id ];
  if( typeof this.config.tstampField == "string" &&
      this.config.tstampField !== "tstamp" ) this.config.tstampField = this.config.tstampField.split(".");
  if( typeof this.config.dataField == "string" &&
      this.config.dataField !== "data" ) this.config.dataField = this.config.dataField.split(".");

  this.id = id;
  this.chartCount = 0;
  this.charts = {};
  this.end = null;
};

App.Datasource.prototype.getNestedValue = function( obj , keyArr ) {
  try
  {
    return keyArr.reduce( function( reduceObj , i ) {
      return reduceObj[i];
    } , obj );
  }
  catch( e )
  {
    return undefined;
  }
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
  var converted = {
    tstamp : this.config.tstampField == "tstamp" ? data.tstamp : this.getNestedValue( data , this.config.tstampField ),
    data : this.config.dataField == "data" ? data.data : this.getNestedValue( data , this.config.dataField )
  };

  return converted;
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
    if( self.config.tstampField !== "tstamp" || self.config.dataField !== "data" )
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
