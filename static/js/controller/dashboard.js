
var App = App || {};
App.Controller = App.Controller || {};

App.Controller.Dashboard = ( function() {

  var selectedPlugin = null;
  var currentDashboard = null;
  var editingChart = null;

  function init()
  {
    $( "#createNewChart" ).on( "click" , createNewChartClick );
    $( "#chartPlugins" ).on( "click" , "a" , chartPluginClick );
    $( "#chartDatasources" ).on( "click" , "a" , chartDatasourceClick );
    $( "#chartDatasourceList" ).on( "click" , "button" , chartDatasourceButtonClick );
    $( "#chartDone" ).on( "click" , chartDoneClick );

    $( document ).on( "click" , ".gridItemHeader button" , gridHeaderButtonClick );
    $( document ).on( "click" , ".gridItemOverlay button" , removeOverlayButtonClick );
  }

  function createNewChartClick( event )
  {
    event.preventDefault();
    selectedPlugin = null;
    App.View.Dashboard.Modal.open();
  }

  function chartPluginClick( event )
  {
    event.preventDefault();

    var id = $( this ).attr( "data-pluginid" );
    if( selectedPlugin !== null && id == selectedPlugin.id ) return;
    selectedPlugin = App.Plugins.getPlugin( id );

    App.View.Dashboard.Modal.loadPluginConfig( selectedPlugin );
  }

  function chartDatasourceClick( event )
  {
    event.stopPropagation();
    event.preventDefault();

    var id = $( this ).attr( "data-dsid" );
    $( this ).remove();

    App.View.Dashboard.Modal.addDatasource( App.Model.Datasource.getDatasource( id ) , selectedPlugin );
  }

  function chartDatasourceButtonClick( event )
  {
    var action = $( this ).attr( "data-act" );
    var $parent = $( this ).parents( ".panel" );

    if( action == "remove" )
    {
      App.View.Dashboard.Modal.removeDatasource( $parent );
    }
    else if( action == "config" )
    {
      $parent.find( ".panel-body" ).toggle();
    }
  }

  function chartDoneClick()
  {
    var chart,
        i, key,
        $input;

    // Validate
    var errors = [];

    var chartName = $( "#chartName" ).val().trim();
    var $datasources = $( "#chartDatasourceList > div" );

    if( chartName.length < 1 ) errors.push( "Please enter a name." );
    if( selectedPlugin === null ) errors.push( "Please select a plugin." );
    if( $datasources.length < 1 ) errors.push( "Please add at least one datasource." );

    if( errors.length > 0 )
    {
      App.View.Dashboard.Modal.showErrors( errors );
      return;
    }

    if( !editingChart )
    {
      chart = new App.Model.Chart();
      chart.id = genRandomID();
    }
    else chart = editingChart;

    chart.name = chartName;
    chart.plugin = selectedPlugin;
    chart.datasources = [];
    chart.datasourceMap = {};
    chart.components = [];
    chart.config = {};

    for( i = 0; i < $datasources.length; i++ )
    {
      var $datasource = $( $datasources[i] );

      var datasource = {
        datasource : App.Model.Datasource.getDatasource( $datasource.attr( "data-dsid" ) ),
        config : {}
      };

      var uid = $datasource.attr( "data-uid" );

      datasource.config.label = $( "#nds" + uid + "-label" ).val().trim();
      if( !datasource.config.label )
      {
        datasource.config.label = $datasource.attr( "data-dsname" );
      }

      var $dsConfig = $( "#ds" + uid + "-config" );
      for( key in selectedPlugin.datasourceConfig )
      {
        $input = $dsConfig.find( '[data-prop="' + key + '"]' );
        if( $input.length > 0 )
        {
          datasource.config[ key ] = App.View.Dashboard.getInputValue( $input );
        }
        else
        {
          datasource.config[ key ] = selectedPlugin.datasourceConfig[ key ].default;
        }
      }

      chart.addDatasource( datasource.datasource , datasource.config );
    }

    var $chartConfig = $( "#chartPluginConfig" );
    for( key in selectedPlugin.chartConfig )
    {
      $input = $chartConfig.find( '[data-prop="' + key + '"]' );
      if( $input.length > 0 )
      {
        chart.config[ key ] = App.View.Dashboard.getInputValue( $input );
      }
      else
      {
        chart.config[ key ] = selectedPlugin.chartConfig[ key ].default;
      }
    }

    var $container;
    if( !editingChart )
    {
      $container = App.View.Dashboard.createChartContainer( chart );
      chart.load( $container );
    }
    else
    {
      // For now, re-create the chart to change settings...
      // TODO: Allow chart plugins to handle settings changes

      currentDashboard.removeChart( chart.id );
      $container = App.View.Dashboard.updateChartContainer( chart );
      chart.load( $container );
    }

    editingChart = null;
    currentDashboard.addChart( chart );
    App.Settings.saveSettings();

    App.View.Dashboard.Modal.close();
  }

  function gridHeaderButtonClick()
  {
    var action = $( this ).attr( "data-act" );
    var $parent = $( this ).parents( "li" );

    if( action == "remove" )
    {
      App.View.Dashboard.showRemoveOverlay( $parent );

      $overlay.on( "click" , "button" , function() {
        var $parent = null;

      } );

      $content.append( $overlay );
      $overlay.fadeIn( 200 );
    }
    else if( action == "edit" )
    {
      var chart = currentDashboard.getChart( $parent.attr( "data-id" ) );
      editingChart = chart;
      selectedPlugin = chart.plugin;
      App.View.Dashboard.Modal.open( chart );
    }
  }

  function removeOverlayButtonClick()
  {
    var $parent = $( this ).parents( "li" );
    if( $( this ).hasClass( "btn-danger" ) )
    {
      App.View.Dashboard.hideRemoveOverlay( $parent );
    }
    else
    {
      var id = $parent.attr( "data-id" );
      currentDashboard.removeChart( id );

      $( "#gridList" ).gridList( "remove" , $parent );
      App.Settings.saveSettings();
    }
  }

  function gridListOnChange( items )
  {
    if( items.length > 0 )
    {
      $( "#gridList" ).gridList( "_updateElementData" );
      $( "#gridList > li[data-id]" ).each( function() {
        var chart = currentDashboard.getChart( $( this ).attr( "data-id" ) );
        chart.pos = {
          x : Number( $( this ).attr( "data-x" ) ),
          y : Number( $( this ).attr( "data-y" ) ),
          w : Number( $( this ).attr( "data-w" ) ),
          h : Number( $( this ).attr( "data-h" ) )
        };
      } );

      App.Settings.saveSettings();
    }
  }

  function onNetworkMessage( data )
  {
    if( !currentDashboard ) return;

    for( var id in data )
      currentDashboard.pushData( id , data[id] );
  }

  function loadDashboard( dashboard )
  {
    currentDashboard = dashboard;
    App.View.Dashboard.setPageTitle( dashboard.name );

    for( var i in dashboard.charts )
    {
      var chart = dashboard.charts[i];
      var $container = App.View.Dashboard.createChartContainer( chart );
      chart.load( $container );
    }

    App.View.Dashboard.initGridList();
    dashboard.load();
  }

  function genRandomID( len )
  {
    len = len || 16;
    var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    var id = "";
    for( var i = 0; i < len; i++ ) id += chars[ Math.floor( Math.random() * 62 ) ];
    return id;
  }

  return {
    init : init,
    gridListOnChange : gridListOnChange,
    onNetworkMessage : onNetworkMessage,
    loadDashboard : loadDashboard
  };

} )();