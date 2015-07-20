
var App = App || {};
App.Pages = App.Pages || {};

App.Pages.Charts = ( function() {

  var DEFAULT_CHART_WIDTH = 4;
  var DEFAULT_CHART_HEIGHT = 1;

  var editingChart = null;

  function openChartModal( chartid )
  {
    var chart = ( chartid === undefined ? null : App.Dashboard.currentDashboard.chartSettings[ chartid ] );
    if( chart !== null ) editingChart = chartid;

    var key, i;

    var $modal = $( "#chartModal" );
    var $modalTitle = $modal.find( ".modal-title" );
    var $modalBody = $modal.find( ".modal-body" );

    $( "#chartError" ).hide();

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

    if( chart === null )
    {
      $modalTitle.text( "Create New Chart" );

      $( "#chartName" ).val( "" );
      $( "#chartPluginsButton" ).html( 'Select plugin <span class="caret"></span>' );
      $( "#chartPlugins" ).removeAttr( "data-pluginid" );
    }
    else
    {
      $modalTitle.text( "Edit Chart" );

      $( "#chartName" ).val( chart.name );
      $( "#chartPluginsButton" ).html( chart.chartPlugin + ' <span class="caret"></span>' );
      $( "#chartPlugins" ).attr( "data-pluginid" , chart.chartPlugin );

      for( i = 0; i < chart.datasources.length; i++ )
      {
        modalAddDatasource( chart.datasources[i] , datasources[ chart.datasources[i].id ].name );

        // TODO: Oh God fix this!
        $datasourceDropdown.find( 'a[data-dsid="' + chart.datasources[i].id + '"]' ).parent().remove();
      }
    }

    $modal.modal( "show" );
  }

  function modalAddDatasource( datasource , name )
  {
    dsData = {
      id : datasource.id,
      name : name,
      safe_id : datasource.id.replace( "." , "_" )
    };

    var template = $.templates( "#tmpl_ChartDatasource" );
    var $datasource = $( template.render( dsData ) );
    $( "#chartDatasourceList" ).append( $datasource );

    if( datasource.hasOwnProperty( "config" ) )
    {
      $datasource.find( "#label_" + dsData.safe_id ).val( datasource.config.label );
    }
  }

  function createNewChartClick( event )
  {
    event.preventDefault();
    openChartModal();
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

    modalAddDatasource( { id: $( this ).attr( "data-dsid" ) } , $( this ).text().trim() );
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
    var id = genRandomID(),
        chart = {},
        i;

    // Validate
    var errors = [];

    var chartName = $( "#chartName" ).val().trim();
    var chartPlugin = $( "#chartPlugins" ).attr( "data-pluginid" );
    $datasources = $( "#chartDatasourceList" ).find( "div[data-dsid]" );

    if( chartName.length < 1 ) errors.push( "Please enter a name." );
    if( chartPlugin === undefined ) errors.push( "Please select a plugin." );
    if( $datasources.length < 1 ) errors.push( "Please add at least one datasource." );

    if( errors.length > 0 )
    {
      $alertBox = $( "#chartError" );
      $alertBox.html( errors.join( "<br>" ) );
      $alertBox.show();
      return;
    }

    if( editingChart !== null )
    {
      id = editingChart;
      chart = App.Dashboard.currentDashboard.chartSettings[ id ];
    }

    chart.name = chartName;
    chart.chartPlugin = chartPlugin;
    chart.datasources = [];
    chart.config = {
      history : 1200000
    };

    for( i = 0; i < $datasources.length; i++ )
    {
      var $datasource = $( $datasources[i] );

      var datasource = {
        id : $datasource.attr( "data-dsid" ),
        config : {}
      };

      var safeid = datasource.id.replace( "." , "_" );

      datasource.config.label = $datasource.find( "#label_" + safeid ).val().trim();
      if( !datasource.config.label )
      {
        datasource.config.label = $datasource.attr( "data-dsname" );
      }

      chart.datasources.push( datasource );
    }

    var $listItem;

    if( editingChart === null )
    {
      var template = $.templates( "#tmpl_GridContainer" );
      $listItem = $( template.render( {
        id : id,
        name : chart.name
      } ) );

      $( "#gridList" ).gridList( "add" , $listItem , DEFAULT_CHART_WIDTH , DEFAULT_CHART_HEIGHT );
      loadChart( id , chart , $listItem.find( ".gridItemContent" ) );
    }
    else
    {
      $listItem = $( '#gridList li[data-id="' + editingChart + '"]' );
      $listItem.find( ".gridItemHeader > span" ).text( chart.name );

      // For now, re-create the chart to change settings...
      // TODO: Allow chart plugins to handle settings changes

      App.Dashboard.currentDashboard.removeChart( id );

      $container = $listItem.find( ".gridItemContent" );
      $container.empty();
      loadChart( id , chart , $container );
    }

    App.Dashboard.currentDashboard.subscribeToNewDatasources();

    editingChart = null;
    App.Settings.saveSettings();

    $( "#chartModal" ).modal( "hide" );
  }

  function gridHeaderButtonClick()
  {
    var action = $( this ).attr( "data-act" );
    var $parent = $( this ).parents( "li" );

    if( action == "remove" )
    {
      $content = $parent.find( ".gridItemContent" );
      if( $content.find( ".gridItemOverlay" ).length > 0 ) return;

      $overlay = $(
        '<div class="gridItemOverlay" style="display:none"><div class="gridItemOverlayContent">' +
        '<p>Are you sure you want to delete this chart?</p>' +
        '<p><button type="button" class="btn btn-success">Yes</button> <button type="button" class="btn btn-danger">Cancel</button></p>' +
        '</div></div>'
      );

      $overlay.on( "click" , "button" , function() {
        var $parent = null;
        if( $( this ).hasClass( "btn-danger" ) )
        {
          $parent = $( this ).parents( ".gridItemOverlay" );
          $parent.fadeOut( 200 , function() {
            $parent.remove();
          } );
        }
        else
        {
          $parent = $( this ).parents( "li" );
          var id = $parent.attr( "data-id" );
          $( "#gridList" ).gridList( "remove" , $parent );
          App.Dashboard.currentDashboard.removeChart( id );
          App.Settings.saveSettings();
        }
      } );

      $content.append( $overlay );
      $overlay.fadeIn( 200 );
    }
    else if( action == "edit" )
    {
      var chartid = $parent.attr( "data-id" );
      openChartModal( chartid );
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
      var $listItem = $( template.render( {
        id : chartid,
        name : chart.name
      } ) );

      $listItem.attr( {
        'data-w' : DEFAULT_CHART_WIDTH,
        'data-h' : DEFAULT_CHART_HEIGHT,
        'data-x' : Math.floor( count / 3 ) * DEFAULT_CHART_WIDTH,
        'data-y' : count % 3
      } );

      $container.append( $listItem );
      loadChart( chartid , chart , $listItem.find( ".gridItemContent" ) );

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

  function loadChart( id , chart , $container )
  {
    var ChartPlugin = App.Plugins.getChart( chart.chartPlugin );
    if( ChartPlugin !== null )
    {
      var chartDatasources = [] , datasource;
      for( i = 0; i < chart.datasources.length; i++ )
      {
        datasource = App.Dashboard.currentDashboard.getDatasource( chart.datasources[i].id );
        if( datasource === null )
        {
          datasource = new App.Datasource( chart.datasources[i].id );
          App.Dashboard.currentDashboard.addDatasource( datasource );
        }

        chartDatasources.push( {
          datasource : datasource,
          config : chart.datasources[i].config
        } );
      }

      var newChart = new ChartPlugin( $container[0] , chartDatasources , chart.config , [] );
      for( i = 0; i < chartDatasources.length; i++ )
      {
        chartDatasources[i].datasource.addChart( id , i , newChart );
      }

      App.Dashboard.currentDashboard.chartSettings[ id ] = chart;
      App.Dashboard.currentDashboard.charts[ id ] = newChart;
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
