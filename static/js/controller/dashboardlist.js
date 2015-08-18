
var App = App || {};
App.Controller = App.Controller || {};

App.Controller.DashboardList = ( function() {

  function init()
  {
    $( "#createNewDashboard" ).on( "click" , createNewDashboardClick );
    $( "#dashboardDone" ).on( "click" , dashboardDoneClick );
    $( "#dashboardListPage" ).on( "click" , "button" , dashboardButtonClick );
  }

  function createNewDashboardClick( event )
  {
    event.preventDefault();
    App.View.DashboardList.Modal.open();
  }

  function dashboardDoneClick( event )
  {
    var errors = [];
    var dashboardName = $( "#dashboardName" ).val().trim();
    if( dashboardName.length < 1 ) errors.push( "Please enter a name." );

    if( errors.length > 0 )
    {
      App.View.DashboardList.Modal.showErrors( errors );
      return;
    }

    var dashboard = new App.Dashboard( dashboardName );

    var dashid = App.Dashboard.addDashboard( dashboard );
    App.Settings.saveSettings();
    App.View.DashboardList.Modal.close();
    openDashboard( dashid );
  }

  function dashboardButtonClick()
  {
    var id = $( this ).attr( "data-open" );
    if( id !== undefined )
    {
      openDashboard( id );
    }
    else
    {
      id = $( this ).attr( "data-remove" );
      var name = $( this ).siblings( "button" ).text();
      App.Modal.show( "Remove " + name + "?" , "" , function() {
        App.Dashboard.removeDashboard( id );
        App.Settings.saveSettings();
        App.View.DashboardList.render( App.Dashboard.dashboards );
      } );
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

  return {
    init : init
  };

} )();
