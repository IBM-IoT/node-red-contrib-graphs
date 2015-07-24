
var App = App || {};
App.Pages = App.Pages || {};

App.Pages.Dashboards = ( function() {

  function dashButtonClick()
  {
    var id = $( this ).attr( "data-open" );
    if( id !== undefined )
    {
      openDashboard( id );
    }
    else
    {
      id = $( this ).attr( "data-remove" );
      App.Dashboard.removeDashboard( id );
      App.Settings.saveSettings();
      populateDashboardList( App.Dashboard.dashboards );
    }
  }

  function openDashboard( id )
  {
    var dashboard = App.Dashboard.getDashboard( id );
    if( dashboard === null ) return;

    App.Net.createConnection().done( function() {
      App.Page.navigateTo( "#chartsPage" , function() {
        App.Pages.Charts.loadDashboard( dashboard );
      } );
    } );
  }

  function createNewDashboardClick( event )
  {
    event.preventDefault();
    openModal();
  }

  function dashboardDoneClick( event )
  {
    var errors = [];

    var dashboardName = $( "#dashboardName" ).val().trim();

    if( dashboardName.length < 1 ) errors.push( "Please enter a name." );

    if( errors.length > 0 )
    {
      $alertBox = $( "#dashboardError" );
      $alertBox.html( errors.join( "<br>" ) );
      $alertBox.show();
      return;
    }

    var dashboard = new App.Dashboard( dashboardName );

    var dashid = App.Dashboard.addDashboard( dashboard );
    App.Settings.saveSettings();
    $( "#dashboardModal" ).modal( "hide" );
    openDashboard( dashid );
  }

  function openModal()
  {
    var $modal = $( "#dashboardModal" );

    $( "#dashboardError" ).hide();
    $( "#dashboardName" ).val( "" );

    $modal.modal( "show" );
  }

  function init()
  {
    $( "#createNewDashboard" ).on( "click" , createNewDashboardClick );
    $( "#dashboardDone" ).on( "click" , dashboardDoneClick );
  }

  function populateDashboardList( dashboards )
  {
    var $container = $( "#dashboardPage" );
    $container.empty();

    if( dashboards.length > 0 )
    {
      var template = $.templates( "#tmpl_dashboardItems" );
      $container.append( template.render( dashboards ) );

      $container.find( "button" ).on( "click" , dashButtonClick );
    }
    else
    {
      $container.append( '<div class="alert alert-info">No dashboards available.</div>' );
    }
  }

  return {
    init : init,
    populateDashboardList : populateDashboardList
  };

} )();
