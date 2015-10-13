
var App = App || {};
App.Model = App.Model || {};

App.Model.Datasource = ( function() {

  var Datasource = function( id , config ) {
    if( config ) this.unserialize( config );

    this.id = id;
    this.chartCount = 0;
    this.charts = {};
    this.end = null;

    this.historyRequests = {};
  };

  Datasource.prototype.unserialize = function( data )
  {
    this.name = data.name;
    this.tstampField = data.tstampField;
    this.dataField = data.dataField;
    this.dataComponents = data.dataComponents;

    if( this.tstampField !== "tstamp" ) this.tstampField = this.tstampField.split(".");
    if( this.dataField !== "data" ) this.dataField = this.dataField.split(".");
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
      delete this.historyRequests[ id ];
      this.chartCount--;
    }
  };

  Datasource.prototype.updateConfig = function( config )
  {
    this.unserialize( config );
    for( var id in this.charts )
      this.charts[ id ].datasourceConfigChanged( this );
  };

  Datasource.prototype.isEmpty = function() {
    return this.chartCount === 0;
  };

  Datasource.prototype.isReady = function() {
    return this.dataComponents !== undefined;
  };

  Datasource.prototype.convertData = function( data ) {
    if( $.isArray( data ) )
    {
      for( var i = 0; i < data.length; i++ )
        data[i] = this.convertDataPoint( data[i] );

      return data;
    }
    else return this.convertDataPoint( data );
  };

  Datasource.prototype.convertDataPoint = function( data ) {
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

  Datasource.prototype.pushHistoryData = function( chartID , data ) {
    if( !this.charts.hasOwnProperty( chartID ) || !this.historyRequests.hasOwnProperty( chartID ) ) return;

    if( this.tstampField !== "tstamp" || this.dataField !== "data" )
    {
      data = this.convertData( data );
    }

    this.charts[ chartID ].pushData( this , data , this.historyRequests[ chartID ] );
    delete this.historyRequests[ chartID ];
  };

  Datasource.prototype.requestHistoryData = function( chart , start , end , callback ) {
    if( !this.charts.hasOwnProperty( chart.id ) || this.historyRequests.hasOwnProperty( chart.id ) ) return;
    if( typeof callback != "function" ) return;

    this.historyRequests[ chart.id ] = callback;
    App.Net.requestHistoryData( this.id , chart.id , start , end );
  };

  Datasource.getDatasources = function() {
    var dfd = $.Deferred();

    $.getJSON( "api/datasources" ).done( function( datasources ) {
      if( !Datasource.datasources ) Datasource.datasources = {};

      for( var id in datasources )
      {
        if( Datasource.datasources.hasOwnProperty( id ) )
          Datasource.datasources[ id ].updateConfig( datasources[id] );
        else
          Datasource.datasources[ id ] = new Datasource( id , datasources[id] );
      }

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
