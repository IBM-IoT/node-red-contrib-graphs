
var App = App || {};

App.Main = ( function() {

  function dashButtonClick()
  {
    var id = $( this ).attr( "data-dash" );
    var dashboard = App.Dashboard.getDashboard( id );
    if( dashboard === null ) return;

    App.Net.createConnection().done( function() {
      App.Page.navigateTo( "#chartsPage" , function() {
        loadDashboard( dashboard );
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

    var datasources = App.Datasource.datasources;
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

  function loadDashboard( dashboard )
  {
    App.Dashboard.currentDashboard = dashboard;

    var $container = $( "#gridList" );
    var count = 0;

    for( var chartid in dashboard.chartSettings )
    {
      var chart = dashboard.chartSettings[ chartid ];
      var i, dsid;

      var template = $.templates( "#tmpl_GridContainer" );
      var $listItem = $( template.render( { name : chart.name } ) );

      $listItem.attr( {
        'data-w' : 6,
        'data-h' : 1,
        'data-x' : Math.floor( count / 3 ) * 6,
        'data-y' : count % 3
      } );

      $container.append( $listItem );
      loadChart( chart , $listItem.find( ".gridItemContent" ) );

      count++;
    }

    $container.gridList( {
      rows : 3
    } , {
      handle : ".gridItemHeader",
      zIndex : 1000
    } );

    App.Dashboard.currentDashboard.subscribeToNewDatasources();
  }

  function loadChart( chart , $container )
  {
    var ChartPlugin = App.Plugins.getChart( chart.chartPlugin );
    if( ChartPlugin !== null )
    {
      var chartDatasources = [] , datasource;
      for( i = 0; i < chart.datasources.length; i++ )
      {
        datasource = App.Dashboard.currentDashboard.getDatasource( chart.datasources[i] );
        if( datasource === null )
        {
          datasource = new App.Datasource( chart.datasources[i] );
          App.Dashboard.currentDashboard.addDatasource( datasource );
        }

        chartDatasources.push( datasource );
      }

      var newChart = new ChartPlugin( $container[0] , chartDatasources , chart.config , [] );
      for( i = 0; i < chartDatasources.length; i++ )
      {
        chartDatasources[i].addChart( i , newChart );
      }
    }
    else
    {
      $container.html( '<div class="alert alert-danger">Could not find plugin: ' + chart.chartPlugin + '</div>' );
    }
  }

  function init()
  {
    App.Plugins.loadPlugins().done( function() {
      $.when( $.getJSON( "api/datasources" ) , App.Settings.loadSettings() ).done( function( _datasources , _settings ) {

        App.Datasource.datasources = _datasources[0];
        var dashboards = App.Dashboard.dashboards = _settings;

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

  function genRandomID( len )
  {
    len = len || 16;
    var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    var id = "";
    for( var i = 0; i < len; i++ ) id += chars[ Math.floor( Math.random() * 72 ) ];
    return id;
  }

  return {
    init : init
  };

} )();

$( window ).on( "resize" , function() {
  $( "#gridList" ).gridList( "resize" );
} );

$( document ).on( "ready" , function() {

  App.Main.init();

} );
