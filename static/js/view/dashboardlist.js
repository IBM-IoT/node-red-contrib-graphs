
var App = App || {};
App.View = App.View || {};

App.View.DashboardList = ( function() {

  var Modal = ( function() {

    function open()
    {
      var $modal = $( "#dashboardModal" );

      $( "#dashboardError" ).hide();
      $( "#dashboardName" ).val( "" );

      $modal.one( "shown.bs.modal" , function() {
        $( "#dashboardName" ).focus();
      } );
      $modal.modal( "show" );
    }

    function close()
    {
      $( "#dashboardModal" ).modal( "hide" );
    }

    function showErrors( errors )
    {
      $alertBox = $( "#dashboardError" );
      $alertBox.html( errors.join( "<br>" ) );
      $alertBox.show();
    }

    return {
      open : open,
      close : close,
      showErrors : showErrors
    };

  } )();

  function render( dashboards )
  {
    var $container = $( "#dashboardListPage" );
    $container.empty();

    if( dashboards.length > 0 )
    {
      var template = $.templates( "#tmpl_dashboardItems" );
      $container.append( template.render( dashboards ) );
    }
    else
    {
      $container.append( '<div class="alert alert-info">No dashboards available.</div>' );
    }
  }

  return {
    Modal : Modal,

    render : render
  };

} )();
