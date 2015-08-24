
var App = App || {};
App.Model = App.Model || {};

App.Model.Datasource = ( function() {

  var Datasource = function( id , config ) {
    var i;

    for( i in config )
      this[i] = config[i];

    if( this.tstampField !== "tstamp" ) this.tstampField = this.tstampField.split(".");
    if( this.dataField !== "data" ) this.dataField = this.dataField.split(".");

    this.id = id;
    this.chartCount = 0;
    this.charts = {};
    this.end = null;
  };

  Datasource.prototype.getNestedValue = function( obj , keyArr ) {
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

  Datasource.prototype.addChart = function( chart ) {
    if( this.charts.hasOwnProperty( chart.id ) )
    {
      console.error( "Datasource already has chart: " + chart.id );
      return;
    }

    this.charts[ chart.id ] = chart;
    this.chartCount++;
  };

  Datasource.prototype.removeChart = function( id ) {
    if( this.charts.hasOwnProperty( id ) )
    {
      delete this.charts[ id ];
      this.chartCount--;
    }
  };

  Datasource.prototype.isEmpty = function() {
    return this.chartCount === 0;
  };

  Datasource.prototype.convertData = function( data ) {
    var converted = {
      tstamp : this.tstampField == "tstamp" ? data.tstamp : this.getNestedValue( data , this.tstampField ),
      data : this.dataField == "data" ? data.data : this.getNestedValue( data , this.dataField )
    };

    return converted;
  };

  Datasource.prototype.pushData = function( data ) {
    data = this.convertData( data );

    for( var id in this.charts )
    {
      this.charts[id].pushData( this , data );
    }
  };

  Datasource.prototype.requestHistoryData = function( chart , start , end , callback ) {
    var self = this;

    $.getJSON( "api/datasources/history?id=" + this.id + "&start=" + start + "&end=" + end ).done( function( data ) {
      if( self.tstampField !== "tstamp" || self.dataField !== "data" )
      {
        for( var i = 0; i < data.length; i++ )
          data[i] = self.convertData( data[i] );
      }

      chart.pushData( self , data , callback );
    } );
  };

  Datasource.getDatasources = function() {
    var dfd = $.Deferred();

    $.getJSON( "api/datasources" ).done( function( datasources ) {
      Datasource.datasources = {};
      for( var id in datasources )
        Datasource.datasources[ id ] = new Datasource( id , datasources[id] );

      dfd.resolve();
    } );

    return dfd.promise();
  };

  Datasource.getDatasource = function( id )
  {
    return Datasource.datasources.hasOwnProperty( id ) ? Datasource.datasources[id] : null;
  };

  Datasource.datasources = null;

  return Datasource;

} )();
