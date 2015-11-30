
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
    $( "#chartDone" ).on( "click" , chartDoneClick );

    $( document ).on( "click" , ".gridItemHeader button" , gridHeaderButtonClick );
    $( document ).on( "click" , ".gridItemOverlay button" , removeOverlayButtonClick );
    $( document ).on( "click" , ".datasourceComponentBtn button" , componentEnableClick );

    App.Page.onPageChange( onPageChange );
  }

  function onPageChange( page , data )
  {
    if( page == "#dashboardPage" )
    {
      var dashboard = App.Model.Dashboard.getDashboard( data );
      if( dashboard )
      {
        App.Net.createConnection().done( function() {
          App.Model.Datasource.getDatasources().done( function() {
            loadDashboard( dashboard );
          } );
        } );
      }
      else
      {
        // Quick-fix: Wait to make sure page fade completes before changing pages
        // TODO: Add navigation queue
        console.log( "Dashboard not found: " + data );
        setTimeout( function() {
          App.Page.navigateTo( "" );
        } , 500 );
      }
    }
    else
    {
      if( currentDashboard )
      {
        App.Net.closeConnection();
        currentDashboard.unload();
        currentDashboard = null;
      }

      App.View.Dashboard.Modal.close();
    }
  }

  function createNewChartClick( event )
  {
    event.preventDefault();
    selectedPlugin = null;
    editingChart = null;
    App.View.Dashboard.Modal.open();
  }

  function chartPluginClick( event )
  {
    event.preventDefault();

    var id = $( this ).attr( "data-pluginid" );
    if( selectedPlugin !== null && id == selectedPlugin.id ) return;
    selectedPlugin = App.Plugins.getPlugin( id );

    App.View.Dashboard.Modal.loadPluginConfig( selectedPlugin , editingChart );
  }

  function chartDatasourceClick( event )
  {
    event.stopPropagation();
    event.preventDefault();

    var id = $( this ).attr( "data-dsid" );
    $( this ).remove();

    App.View.Dashboard.Modal.addDatasource( App.Model.Datasource.getDatasource( id ) , selectedPlugin );
  }

  function chartDatasourceHeaderClick( event )
  {
    $( this ).siblings( ".panel-body" ).toggle();
  }

  function chartDatasourceRemoveClick( event )
  {
    event.stopPropagation();
    App.View.Dashboard.Modal.removeDatasource( $( this ).parents( ".panel" ) );
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
    else
    {
      chart = editingChart;
      chart.resetDatasources();
    }

    chart.name = chartName;
    chart.plugin = selectedPlugin;
    chart.config = {};

    for( i = 0; i < $datasources.length; i++ )
    {
      var $datasource = $( $datasources[i] );

      var datasource = {
        datasource : App.Model.Datasource.getDatasource( $datasource.attr( "data-dsid" ) ),
        config : {}
      };

      var uid = $datasource.attr( "data-uid" );

      var $dsConfig = $datasource.find( ".datasourcePluginConfig" );
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

      datasource.config.label = $( "#nds" + uid + "-label" ).val().trim();
      if( !datasource.config.label )
      {
        datasource.config.label = $datasource.attr( "data-dsname" );
      }

      var componentConfig = {};
      var $components = $datasource.find( ".datasourceComponent" );
      for( var k = 0; k < $components.length; k++ )
      {
        var $component = $( $components[k] );
        var componentName = $component.attr( "data-component" );
        componentConfig[ componentName ] = {
          enabled : $component.find( "button" ).hasClass( "btn-success" ),
          label : $component.find( "input" ).val().trim()
        };
      }

      datasource.config.components = componentConfig;

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
    }
    else
    {
      // For now, re-create the chart to change settings...
      // TODO: Allow chart plugins to handle settings changes

      currentDashboard.removeChart( chart.id );
      $container = App.View.Dashboard.updateChartContainer( chart );
    }

    editingChart = null;
    currentDashboard.addChart( chart );
    chart.load( $container );
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

  function componentEnableClick()
  {
    $( this ).toggleClass( "btn-success btn-default" );
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

    currentDashboard.pushData( data );
  }

  function onNetworkDisconnect()
  {
    if( !currentDashboard ) return;

    App.Net.createConnection().done( function() {
      currentDashboard.subscribeToAllDatasources();
      App.Model.Datasource.getDatasources();
    } );
  }

  function loadDashboard( dashboard )
  {
    currentDashboard = dashboard;
    selectedPlugin = null;
    editingChart = null;
    App.View.Dashboard.setPageTitle( dashboard.name );
    App.View.Dashboard.createNewGridList();

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
    chartDatasourceHeaderClick : chartDatasourceHeaderClick,
    chartDatasourceRemoveClick : chartDatasourceRemoveClick,
    gridListOnChange : gridListOnChange,
    onNetworkMessage : onNetworkMessage,
    onNetworkDisconnect : onNetworkDisconnect,
    loadDashboard : loadDashboard
  };

} )();
