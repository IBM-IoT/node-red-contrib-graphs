
var App = App || {};
App.Pages = App.Pages || {};

App.Pages.Charts = ( function() {

  var DEFAULT_CHART_WIDTH = 2;
  var DEFAULT_CHART_HEIGHT = 1;

  var editingChart = null;
  var selectedPlugin = null;
  var datasourceNextID = 0;

  var $datasourceConfigTemplate = null;

  function openChartModal( chartid )
  {
    selectedPlugin = null;
    datasourceNextID = 0;
    $datasourceConfigTemplate = null;

    var chart = ( chartid === undefined ? null : App.Dashboard.currentDashboard.chartSettings[ chartid ] );
    editingChart = chart;

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
      $pluginDropdown.append( '<li><a data-pluginid="' + key + '" href="#">' + chartPlugins[ key ].display_name + '</a></li>' );
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
    $( "#chartPluginConfig" ).empty();

    if( chart === null )
    {
      $modalTitle.text( "Create New Chart" );

      $( "#chartName" ).val( "" );
      $( "#chartPluginsButton" ).html( 'Select plugin <span class="caret"></span>' );
    }
    else
    {
      $modalTitle.text( "Edit Chart" );

      $( "#chartName" ).val( chart.name );
      $( "#chartPluginsButton" ).html( App.Plugins.getPlugin( chart.chartPlugin ).display_name + ' <span class="caret"></span>' );
      selectedPlugin = App.Plugins.getPlugin( chart.chartPlugin );

      for( i = 0; i < chart.datasources.length; i++ )
      {
        if( !datasources.hasOwnProperty( chart.datasources[i].id ) ) continue;

        modalAddDatasource( chart.datasources[i] , datasources[ chart.datasources[i].id ].name );

        // TODO: Oh God fix this!
        $datasourceDropdown.find( 'a[data-dsid="' + chart.datasources[i].id + '"]' ).parent().remove();
      }

      modalLoadPluginConfig( chartPlugins[ chart.chartPlugin ] );
    }

    $modal.modal( "show" );
  }

  function modalAddDatasource( datasource , name )
  {
    dsData = {
      id : datasource.id,
      name : name,
      uid : datasourceNextID++
    };

    var template = $.templates( "#tmpl_ChartDatasource" );
    var $datasource = $( template.render( dsData ) );
    $( "#chartDatasourceList" ).append( $datasource );

    if( datasource.hasOwnProperty( "config" ) )
    {
      $datasource.find( "#nds" + dsData.uid + "-label" ).val( datasource.config.label );
    }

    if( selectedPlugin !== null )
    {
      modalLoadPluginDatasourceConfig( $( "#ds" + dsData.uid + "-config" ) , selectedPlugin , datasource );
    }
  }

  function modalLoadPluginConfig( plugin )
  {
    var chart = null;
    if( editingChart !== null && editingChart.chartPlugin == plugin.id )
    {
      chart = editingChart;
    }

    var $container = $( "#chartPluginConfig" );
    $container.empty();

    var $template = $( 'script[data-chart-config="' + plugin.id + '"]' );
    if( $template.length > 0 )
    {
      $container.html( $template.text() );

      if( chart !== null )
      {
        for( var key in plugin.chartConfig )
        {
          if( chart.config.hasOwnProperty( key ) )
          {
            var $input = $container.find( '[data-prop="' + key + '"]' );
            setInputValue( $input , chart.config[ key ] );
          }
        }
      }
    }
  }

  function modalLoadPluginDatasourceConfig( $container , plugin , datasource )
  {
    $datasourceConfigTemplate = $( 'script[data-datasource-config="' + plugin.id + '"]' );
    if( $datasourceConfigTemplate.length < 1 ) $datasourceConfigTemplate = null;

    var chart = null;
    if( editingChart !== null && editingChart.chartPlugin == plugin.id )
    {
      chart = editingChart;
    }

    $container.empty();
    if( $datasourceConfigTemplate !== null )
    {
      $container.html( $datasourceConfigTemplate.text() );

      if( chart !== null && datasource && datasource.hasOwnProperty( "config" ) )
      {
        for( var key in plugin.datasourceConfig )
        {
          if( datasource.config.hasOwnProperty( key ) )
          {
            var $input = $container.find( '[data-prop="' + key + '"]' );
            setInputValue( $input , datasource.config[ key ] );
          }
        }
      }
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
    if( selectedPlugin !== null && id == selectedPlugin.id ) return;
    selectedPlugin = App.Plugins.getPlugin( id );

    var name = $( this ).text();
    $( "#chartPlugins" ).siblings( "button" ).html( name + ' <span class="caret"></span>' );

    modalLoadPluginConfig( selectedPlugin );

    var $datasources = $( "#chartDatasourceList > div" );
    for( var i = 0; i < $datasources.length; i++ )
    {
      var $datasource = $( $datasources[i] );
      var $datasourceConfig = $( '#ds' + $datasource.attr( 'data-uid' ) + '-config' );
      modalLoadPluginDatasourceConfig( $datasourceConfig , selectedPlugin );
    }
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
      $alertBox = $( "#chartError" );
      $alertBox.html( errors.join( "<br>" ) );
      $alertBox.show();
      return;
    }

    if( editingChart !== null )
    {
      chart = editingChart;
    }
    else
    {
      chart = {
        id : genRandomID()
      };
    }

    chart.name = chartName;
    chart.chartPlugin = selectedPlugin.id;
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
          datasource.config[ key ] = getInputValue( $input );
        }
        else
        {
          datasource.config[ key ] = selectedPlugin.datasourceConfig[ key ].default;
        }
      }

      chart.datasources.push( datasource );
    }

    var $chartConfig = $( "#chartPluginConfig" );
    for( key in selectedPlugin.chartConfig )
    {
      $input = $chartConfig.find( '[data-prop="' + key + '"]' );
      if( $input.length > 0 )
      {
        chart.config[ key ] = getInputValue( $input );
      }
      else
      {
        chart.config[ key ] = selectedPlugin.chartConfig[ key ].default;
      }
    }

    var $listItem;

    if( editingChart === null )
    {
      var template = $.templates( "#tmpl_GridContainer" );
      $listItem = $( template.render( {
        id : chart.id,
        name : chart.name
      } ) );

      $( "#gridList" ).gridList( "add" , $listItem , DEFAULT_CHART_WIDTH , DEFAULT_CHART_HEIGHT );
      loadChart( chart.id , chart , $listItem.find( ".gridItemContent" ) );
    }
    else
    {
      $listItem = $( '#gridList li[data-id="' + chart.id + '"]' );
      $listItem.find( ".gridItemHeader > span" ).text( chart.name );

      // For now, re-create the chart to change settings...
      // TODO: Allow chart plugins to handle settings changes

      App.Dashboard.currentDashboard.removeChart( chart.id );

      $container = $listItem.find( ".gridItemContent" );
      $container.empty();
      loadChart( chart.id , chart , $container );
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
    $( "#titleDashboard" ).text( " : " + dashboard.name );

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
        'data-x' : ( count % 2 ) * DEFAULT_CHART_WIDTH,
        'data-y' : Math.floor( count / 2 )
      } );

      $container.append( $listItem );
      loadChart( chartid , chart , $listItem.find( ".gridItemContent" ) );

      count++;
    }

    $container.gridList( {
      rows : 4,
      vertical : true,
      widthHeightRatio : 0.65
    } , {
      handle : ".gridItemHeader",
      zIndex : 1000
    } );

    App.Dashboard.currentDashboard.subscribeToNewDatasources();
  }

  function loadChart( id , chart , $container )
  {
    var ChartPlugin = App.Plugins.getPlugin( chart.chartPlugin );
    if( ChartPlugin !== null )
    {
      ChartPlugin = ChartPlugin.plugin;
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

  function getInputValue( $input )
  {
    if( $input.attr( "type" ) === "checkbox" )
    {
      return $input.prop( "checked" );
    }
    return $input.val().trim();
  }

  function setInputValue( $input , value )
  {
    if( $input.attr( "type" ) === "checkbox" )
    {
      $input.prop( "checked" , value );
    }
    else
    {
      $input.val( value );
    }
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
