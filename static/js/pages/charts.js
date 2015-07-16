
var App = App || {};
App.Pages = App.Pages || {};

App.Pages.Charts = ( function() {

  var DEFAULT_CHART_WIDTH = 4;
  var DEFAULT_CHART_HEIGHT = 1;

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
    $( "#chartPlugins" ).attr( "data-pluginid" , id );
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
    // TODO: Validate form

    var id = genRandomID(),
        chart = {},
        i;
    chart.name = $( "#chartName" ).val().trim();
    chart.chartPlugin = $( "#chartPlugins" ).attr( "data-pluginid" );
    chart.datasources = [];
    chart.config = {
      history : 1200000
    };

    $datasources = $( "#chartDatasourceList" ).find( "div[data-dsid]" );
    for( i = 0; i < $datasources.length; i++ )
    {
      chart.datasources.push( $( $datasources[i] ).attr( "data-dsid" ) );
    }

    var template = $.templates( "#tmpl_GridContainer" );
    var $listItem = $( template.render( { name : chart.name } ) );
    $( "#gridList" ).gridList( "add" , $listItem , DEFAULT_CHART_WIDTH , DEFAULT_CHART_HEIGHT );
    loadChart( chart , $listItem.find( ".gridItemContent" ) );
    App.Dashboard.currentDashboard.subscribeToNewDatasources();

    $( "#chartModal" ).modal( "hide" );
  }

  function gridHeaderButtonClick()
  {
    var action = $( this ).attr( "data-act" );

    if( action == "remove" )
    {
      $content = $( this ).parents( "li" ).find( ".gridItemContent" );
      if( $content.find( ".gridItemOverlay" ).length > 0 ) return;

      $overlay = $(
        '<div class="gridItemOverlay" style="display:none"><div class="gridItemOverlayContent">' +
        '<p>Are you sure you want to delete this chart?</p>' +
        '<p><button type="button" class="btn btn-success">Yes</button> <button type="button" class="btn btn-danger">Cancel</button></p>' +
        '</div></div>'
      );

      $overlay.on( "click" , "button" , function() {
        if( $( this ).hasClass( "btn-danger" ) )
        {
          var $parent = $( this ).parents( ".gridItemOverlay" );
          $parent.fadeOut( 200 , function() {
            $parent.remove();
          } );
        }
      } );

      $content.append( $overlay );
      $overlay.fadeIn( 200 );
    }
    else if( action == "edit" )
    {

    }
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
        'data-w' : DEFAULT_CHART_WIDTH,
        'data-h' : DEFAULT_CHART_HEIGHT,
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

  function genRandomID( len )
  {
    len = len || 16;
    var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    var id = "";
    for( var i = 0; i < len; i++ ) id += chars[ Math.floor( Math.random() * 62 ) ];
    return id;
  }

  function init()
  {
    $( "#createNewChart" ).on( "click" , createNewChartClick );
    $( "#chartPlugins" ).on( "click" , "a" , chartPluginClick );
    $( "#chartDatasources" ).on( "click" , "a" , chartDatasourceClick );
    $( "#chartDatasourceList" ).on( "click" , "button" , chartDatasourceButtonClick );
    $( "#chartDone" ).on( "click" , chartDoneClick );

    $( document ).on( "click" , ".gridItemHeader button" , gridHeaderButtonClick );
  }

  return {
    init : init,
    loadDashboard : loadDashboard
  };

} )();
