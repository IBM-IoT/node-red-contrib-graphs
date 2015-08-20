
var App = App || {};
App.Model = App.Model || {};

App.Model.Datasource = ( function() {

  var Datasource = function( id , config ) {
    for( var i in config )
      this[i] = config[i];

    this.id = id;
    this.chartCount = 0;
    this.charts = {};
    this.end = null;
  };

  Datasource.prototype.addChart = function( chart , index ) {
    if( this.charts.hasOwnProperty( chart.id ) )
    {
      console.error( "Datasource already has chart: " + chart.id );
      return;
    }

    this.charts[ chart.id ] = {
      index : index,
      chart : chart
    };

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
    if( this.tstampField !== "tstamp" )
    {
      data.tstamp = data[ this.tstampField ];
      delete data[ this.tstampField ];
    }

    if( this.dataField !== "data" )
    {
      data.data = data[ this.dataField ];
      delete data[ this.dataField ];
    }

    return data;
  };

  Datasource.prototype.pushData = function( data ) {
    data = this.convertData( data );

    for( var id in this.charts )
    {
      this.charts[id].chart.pushData( this.charts[id].index , data );
    }
  };

  Datasource.prototype.requestHistoryData = function( index , start , end , callback ) {
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
