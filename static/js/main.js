
var App = App || {};

App.Main = ( function() {

  var wsServer = null;

  var dashboards = [];
  var datasources = null;
  var currentDashboard = null;

  function dashButtonClick()
  {
    var id = $( this ).attr( "data-dash" );
    currentDashboard = dashboards[ id ];

    createConnection().done( function() {
      App.Page.navigateTo( "#chartsPage" , function() {
        loadGraphs( currentDashboard );
      } );
    } );
  }

  function loadGraphs( dashboard )
  {
    var container = $( "#chartsPage" );

    for( var chartid in dashboard.chartSettings )
    {
      var chart = dashboard.chartSettings[ chartid ];
      var i, dsid;

      var outerDiv = $( '<div class="graphContainer"></div>' );
      outerDiv.append( '<h3>' + chart.name + '</h3><span></span>' );
      container.append( outerDiv );

      var ChartPlugin = App.Plugins.getChart( chart.chartPlugin );
      if( ChartPlugin !== null )
      {
        var chartDatasources = [];
        for( i = 0; i < chart.datasources.length; i++ )
        {
          dsid = chart.datasources[i];
          if( !dashboard.datasources.hasOwnProperty( dsid ) )
          {
            if( !datasources.hasOwnProperty( dsid ) ) continue;

            dashboard.datasources[ dsid ] = new App.Datasource( dsid );
          }

          chartDatasources.push( dashboard.datasources[ dsid ] );
        }

        var newChart = new ChartPlugin( outerDiv[0] , chartDatasources , chart.config , [] );
        dashboard.charts[ chartid ] = newChart;
        for( i = 0; i < chartDatasources.length; i++ )
        {
          chartDatasources[i].charts.push( { index : i , chart : newChart } );
        }
      }
      else
      {
        outerDiv.append( '<h3>Chart type not found: ' + chart.chartPlugin + '</h3>' );
      }
    }

    subscribeToAllDatasources();
  }

  function subscribeToAllDatasources()
  {
    var subDatasources = [];
    for( var id in currentDashboard.datasources )
    {
      subDatasources.push( id );
    }

    wsServer.send( JSON.stringify( { m : "sub" , id : subDatasources } ) );
  }

  function createConnection()
  {
    var dfd = $.Deferred();

    wsServer = new WebSocket( "ws://" + location.host + location.pathname + "dsws" );

    wsServer.onopen = function( event ) {
      dfd.resolve();
    };

    wsServer.onmessage = function( event ) {
      var data = event.data;
      try
      {
        data = JSON.parse( data );
      }
      catch( e ) {} // No worries, treat data as String

      if( typeof data === "string" )
      {

      }
      else
      {
        // console.log( "--- New data" );
        for( var dsid in data )
        {
          currentDashboard.pushData( dsid , data[ dsid ] );

          if( $.isArray( data[ dsid ][0] ) )
          {
            // console.log( "- " + dsid );

            for( var i = 0; i < data[ dsid ].length; i++ )
            {
              var d = new Date( data[ dsid ][i][0] );
              //console.log( d.getTime() + "(" + d.toLocaleTimeString() + ")" , data[ dsid ][i][1] );
            }
          }
        }
      }
    };

    wsServer.onclose = function( event ) {
      console.log( "Close" , event );
      wsServer = null;
      if( event.code === 1000 )
      {
        createConnection().done( function() {
          subscribeToAllDatasources();
        } );
      }
    };

    wsServer.onerror = function( event ) {
      console.log( "Error" , event );
      wsServer = null;
    };

    return dfd.promise();
  }

  function init()
  {
    App.Plugins.loadPlugins().done( function() {
      $.when( $.getJSON( "api/datasources" ) , App.Settings.loadSettings() ).done( function( _datasources , _settings ) {

        datasources = _datasources[0];
        dashboards = _settings;

        var container = $( "#dashboardPage" );
        for( var i = 0; i < dashboards.length; i++ )
        {
          container.append( '<p><button type="button" class="btn btn-default" data-dash="' + i + '">' + dashboards[i].name + '</button></p>' );
        }

        container.find( "button" ).on( "click" , dashButtonClick );

      } );
    } ).fail( function() {
      $( "#dashboardPage" ).append( '<div class="alert alert-danger">Error loading plugins.</div>' );
    } ).always( function() {
      App.Page.navigateTo( "#dashboardPage" );
    } );
  }

  function requestHistoryData( id , start , end )
  {
    if( wsServer )
    {
      var msg = {
        m : "history",
        id : id,
        start : start,
        end : end
      };

      wsServer.send( JSON.stringify( msg ) );
    }
  }

  return {
    init : init,
    requestHistoryData : requestHistoryData
  };

} )();

$( document ).on( "ready" , function() {

  App.Main.init();

} );
