
var App = App || {};
App.View = App.View || {};

App.View.Dashboard = ( function() {

  var DEFAULT_CHART_WIDTH = 2;
  var DEFAULT_CHART_HEIGHT = 1;

  var $gridList = null;

  var Modal = ( function() {

    var datasourceNextID = 0;

    function open( chart )
    {
      datasourceNextID = 0;

      var key, i;

      var $modal = $( "#chartModal" );
      var $modalTitle = $modal.find( ".modal-title" );
      var $modalBody = $modal.find( ".modal-body" );

      $( "#chartError" ).hide();

      // Build plugins dropdown
      setSelectedPlugin();
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

      var datasources = App.Model.Datasource.datasources;
      for( key in datasources )
      {
        $datasourceDropdown.append( '<li><a data-dsid="' + key + '" href="#"><span class="glyphicon glyphicon-plus"></span> ' + datasources[key].name + '</a></li>' );
      }

      $( "#chartDatasourceList" ).empty();
      $( "#chartPluginConfig" ).empty();

      if( !chart )
      {
        $modalTitle.text( "Create New Chart" );

        $( "#chartName" ).val( "" );
      }
      else
      {
        $modalTitle.text( "Edit Chart" );

        $( "#chartName" ).val( chart.name );

        for( i = 0; i < chart.datasources.length; i++ )
        {
          addDatasource( chart.datasources[i].datasource , chart.plugin , chart.datasources[i].config );

          // TODO: Oh God fix this!
          $datasourceDropdown.find( 'a[data-dsid="' + chart.datasources[i].datasource.id + '"]' ).parent().remove();
        }

        if( chart.plugin )
        {
          loadPluginConfig( chart.plugin , chart );
        }
      }

      $modal.one( "shown.bs.modal" , function() {
        $( "#chartName" ).focus();
      } );
      $modal.modal( "show" );
    }

    function close()
    {
      $( "#chartModal" ).modal( "hide" );
    }

    function showErrors( errors )
    {
      $alertBox = $( "#chartError" );
      $alertBox.html( errors.join( "<br>" ) );
      $alertBox.show();
    }

    function setSelectedPlugin( plugin )
    {
      var text = plugin ? plugin.display_name : "Select plugin";
      $( "#chartPluginsButton" ).html( text + ' <span class="caret"></span>' );
    }

    function addDatasource( datasource , plugin , config )
    {
      dsData = {
        id : datasource.id,
        name : datasource.name,
        uid : datasourceNextID++
      };

      var template = $.templates( "#tmpl_ChartDatasource" );
      var $datasource = $( template.render( dsData ) );
      $( "#chartDatasourceList" ).append( $datasource );

      if( config )
      {
        $datasource.find( "#nds" + dsData.uid + "-label" ).val( config.label );
      }

      if( datasource.dataComponents && !plugin.disableComponentDiscovery )
      {
        $datasource.find( "#nds" + dsData.uid + "-label" ).hide();

        var dcTemplate = $.templates( "#tmpl_ChartDatasourceComponent" );
        var $componentContainer = $( '<div class="datasourceDataComponents"></div>' );
        $datasource.find( ".panel-body" ).prepend( $componentContainer );
        for( var i = 0; i < datasource.dataComponents.length; i++ )
        {
          var dcData = { name : datasource.dataComponents[i] };
          $componentContainer.append( dcTemplate.render( dcData ) );
        }

        if( config && config.components )
        {
          for( var key in config.components )
          {
            var $component = $componentContainer.find( 'div[data-component="' + key + '"]' );
            if( $component.length )
            {
              if( !config.components[key].enabled ) $component.find( "button" ).toggleClass( "btn-default btn-success" );
              $component.find( "input" ).val( config.components[key].label );
            }
          }
        }
      }

      if( plugin )
      {
        $datasourceConfig = $datasource.find( ".datasourcePluginConfig" );
        loadPluginDatasourceConfig( $datasourceConfig , plugin , config );
      }

      var $panelHeading = $datasource.find( ".panel-heading" );
      var $removeButton = $panelHeading.find( "button" );
      $panelHeading.on( "click" , App.Controller.Dashboard.chartDatasourceHeaderClick );
      $removeButton.on( "click" , App.Controller.Dashboard.chartDatasourceRemoveClick );
    }

    function removeDatasource( $panel )
    {
      var id = $panel.attr( "data-dsid" );
      var name = $panel.attr( "data-dsname" );

      var $datasourceDropdown = $( "#chartDatasources" );
      $datasourceDropdown.append( '<li><a data-dsid="' + id + '" href="#"><span class="glyphicon glyphicon-plus"></span> ' + name + '</a></li>' );

      $panel.remove();
    }

    function loadPluginConfig( plugin , chart )
    {
      setSelectedPlugin( plugin );

      var $container = $( "#chartPluginConfig" );
      $container.empty();

      $( "#chartDatasourceList > div" ).each( function() {
        var dsConfig = null;
        if( chart ) dsConfig = chart.datasourceMap[ $( this ).attr( "data-dsid" ) ].config;
        loadPluginDatasourceConfig( $( this ).find( ".datasourcePluginConfig" ) , plugin , dsConfig );
      } );

      var $template = $( 'script[data-chart-config="' + plugin.id + '"]' );
      if( !$template.length ) return;

      $container.html( $template.text() );

      var key;
      for( key in plugin.chartConfig )
      {
        var $input = $container.find( '[data-prop="' + key + '"]' );
        if( chart && chart.plugin === plugin && chart.config.hasOwnProperty( key ) )
        {
          setInputValue( $input , chart.config[ key ] );
        }
        else
        {
          setInputValue( $input , plugin.chartConfig[ key ].default );
        }
      }
    }

    function loadPluginDatasourceConfig( $container , plugin , config )
    {
      $container.empty();

      $template = $( 'script[data-datasource-config="' + plugin.id + '"]' );
      if( !$template.length ) return;

      $container.html( $template.text() );

      for( var key in plugin.datasourceConfig )
      {
        var $input = $container.find( '[data-prop="' + key + '"]' );
        if( config && config.hasOwnProperty( key ) )
        {
          setInputValue( $input , config[ key ] );
        }
        else
        {
          setInputValue( $input , plugin.datasourceConfig[ key ].default );
        }
      }
    }

    return {
      open : open,
      close : close,
      showErrors : showErrors,
      addDatasource : addDatasource,
      removeDatasource : removeDatasource,
      loadPluginConfig : loadPluginConfig
    };

  } )();

  function setPageTitle( title )
  {
    $( "#titleDashboard" ).text( " : " + title );
  }

  function createNewGridList()
  {
    $gridList = null;
    $( "#gridList" ).remove();
    $( "#dashboardPage" ).append( '<ul id="gridList"><li class="position-highlight"></li></ul>' );
  }

  function initGridList()
  {
    $gridList = $( "#gridList" );
    $gridList.gridList( {
      rows : 4,
      vertical : true,
      widthHeightRatio : 0.62,
      onChange : App.Controller.Dashboard.gridListOnChange
    } , {
      handle : ".gridItemHeader",
      zIndex : 1000
    } );
  }

  function createChartContainer( chart )
  {
    var template = $.templates( "#tmpl_GridContainer" );
    var $container = $( template.render( chart ) );

    if( chart.pos )
    {
      $container.attr( {
        'data-x' : chart.pos.x,
        'data-y' : chart.pos.y,
        'data-w' : chart.pos.w,
        'data-h' : chart.pos.h
      } );

      if( !$gridList ) $( "#gridList" ).append( $container );
    }
    else if( $gridList )
    {
      var newPos = $gridList.gridList( "add" , $container , DEFAULT_CHART_WIDTH , DEFAULT_CHART_HEIGHT );
      chart.pos = {
        x : newPos.x,
        y : newPos.y,
        w : DEFAULT_CHART_WIDTH,
        h : DEFAULT_CHART_HEIGHT
      };
    }

    return $container.find( ".gridItemContent" );
  }

  function updateChartContainer( chart )
  {
    var $listItem = $( '#gridList li[data-id="' + chart.id + '"]' );
    $listItem.find( ".gridItemHeader > span" ).text( chart.name );

    var $content = $listItem.find( ".gridItemContent" );
    $content.empty();
    return $content;
  }

  function showRemoveOverlay( $container )
  {
    $content = $container.find( ".gridItemContent" );
    if( $content.find( ".gridItemOverlay" ).length > 0 ) return;

    $overlay = $(
      '<div class="gridItemOverlay" style="display:none"><div class="gridItemOverlayContent">' +
      '<p>Are you sure you want to delete this chart?</p>' +
      '<p><button type="button" class="btn btn-success">Yes</button> <button type="button" class="btn btn-danger">Cancel</button></p>' +
      '</div></div>'
    );
  }

  function hideRemoveOverlay( $container )
  {
    var $overlay = $container.find( ".gridItemOverlay" );
    $overlay.fadeOut( 200 , ( function() {
      this.remove();
    } ).bind( $overlay ) );
  }

  function showMissingPlugin( $container , plugin_id )
  {
    $container.append( '<div class="alert alert-danger">Missing plugin: ' + plugin_id + '</div>' );
  }

  function showPendingDatasources( $container , datasources )
  {
    var $alert = $container.find( ".alert" );
    if( !$alert.length )
    {
      $alert = $( '<div class="alert alert-info"></div>' );
      $container.append( $alert );
    }

    var namesHtml = datasources.map( function( d ) {
      return d.name;
    } ).join( ', ' );

    $alert.html( '<strong>Waiting on datasources:</strong> ' + namesHtml );
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

  return {
    Modal : Modal,

    setPageTitle : setPageTitle,
    createNewGridList : createNewGridList,
    initGridList : initGridList,
    createChartContainer : createChartContainer,
    updateChartContainer : updateChartContainer,
    showRemoveOverlay : showRemoveOverlay,
    hideRemoveOverlay : hideRemoveOverlay,
    showMissingPlugin : showMissingPlugin,
    showPendingDatasources : showPendingDatasources,
    getInputValue : getInputValue
  };

} )();
