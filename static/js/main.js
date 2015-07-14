
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

  function createNewChartClick( event )
  {
    event.preventDefault();

    var key;

    var $modal = $( "#chartModal" );
    var $modalBody = $modal.find( ".modal-body" );

    // Build plugins dropdown
    var $pluginDropdown = $( "#chartPlugins" );
    $pluginDropdown.empty();
    var chartPlugins = App.Plugins.getAllPlugins();
    for( key in chartPlugins )
    {
      $pluginDropdown.append( '<li><a data-pluginid="' + key + '" href="#">' + key + '</a></li>' );
    }

    // Build datasources dropdown
    var $datasourceDropdown = $( "#chartDatasources" );
    $datasourceDropdown.empty();
    for( key in datasources )
    {
      $datasourceDropdown.append( '<li><a data-dsid="' + key + '" href="#"><span class="glyphicon glyphicon-plus"></span> ' + datasources[key].name + '</a></li>' );
    }

    $( "#chartDatasourceList" ).empty();

    $modal.modal( "show" );
  }

  function chartPluginClick( event )
  {
    event.preventDefault();

    var id = $( this ).attr( "data-pluginid" );
    var name = $( this ).text();
    $dropdownBtn = $( "#chartPlugins" ).siblings( "button" );
    $dropdownBtn.attr( "data-pluginid" , id );
    $dropdownBtn.html( name + ' <span class="caret"></span>' );
  }

  function chartDatasourceClick( event )
  {
    event.stopPropagation();
    event.preventDefault();

    var dsData = {
      id : $( this ).attr( "data-dsid" ),
      name : $( this ).text().trim()
    };

    var template = $.templates( "#tmpl_ChartDatasource" );

    $( "#chartDatasourceList" ).append( template.render( dsData ) );
    $( this ).remove();
  }

  function chartDatasourceButtonClick( event )
  {
    var action = $( this ).attr( "data-act" );
    var $parent = $( this ).parents( ".panel" );

    if( action == "remove" )
    {
      var id = $parent.attr( "data-dsid" );
      var name = $parent.attr( "data-dsname" );

      var $datasourceDropdown = $( "#chartDatasources" );
      $datasourceDropdown.append( '<li><a data-dsid="' + id + '" href="#"><span class="glyphicon glyphicon-plus"></span> ' + name + '</a></li>' );

      $parent.remove();
    }
    else if( action == "config" )
    {
      $parent.find( ".panel-body" ).toggle();
    }
  }

  function chartDoneClick()
  {

  }

  function loadGraphs( dashboard )
  {
    var container = $( "#gridList" );
    var count = 0;

    for( var chartid in dashboard.chartSettings )
    {
      var chart = dashboard.chartSettings[ chartid ];
      var i, dsid;

      var listItem = $( '<li></li>' );
      listItem.attr( {
        'data-w' : 6,
        'data-h' : 1,
        'data-x' : Math.floor( count / 3 ) * 6,
        'data-y' : count % 3
      } );

      listItem.append( '<div class="gridItemHeader">' + chart.name + '</div>' );

      var innerContainer = $( '<div class="gridItemContent"></div>' );
      listItem.append( innerContainer );

      container.append( listItem );

      // continue;
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

        var newChart = new ChartPlugin( innerContainer[0] , chartDatasources , chart.config , [] );
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

      count++;
    }

    $( "#gridList" ).gridList( {
      rows : 3
    } , {
      handle : ".gridItemHeader",
      zIndex : 1000
    } );

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

    $( "#createNewChart" ).on( "click" , createNewChartClick );
    $( "#chartPlugins" ).on( "click" , "a" , chartPluginClick );
    $( "#chartDatasources" ).on( "click" , "a" , chartDatasourceClick );
    $( "#chartDatasourceList" ).on( "click" , "button" , chartDatasourceButtonClick );
    $( "#chartDone" ).on( "click" , chartDoneClick );
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

  function genRandomID( len )
  {
    len = len || 16;
    var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    var id = "";
    for( var i = 0; i < len; i++ ) id += chars[ Math.floor( Math.random() * 72 ) ];
    return id;
  }

  return {
    init : init,
    requestHistoryData : requestHistoryData
  };

} )();

$( window ).on( "resize" , function() {
  $( "#gridList" ).gridList( "resize" );
} );

$( document ).on( "ready" , function() {

  App.Main.init();

} );
