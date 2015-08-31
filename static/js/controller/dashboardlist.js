
var App = App || {};
App.Controller = App.Controller || {};

App.Controller.DashboardList = ( function() {

  function init()
  {
    $( "#createNewDashboard" ).on( "click" , createNewDashboardClick );
    $( "#dashboardDone" ).on( "click" , dashboardDoneClick );
    $( "#dashboardListPage" ).on( "click" , "button" , dashboardButtonClick );

    App.Page.onPageChange( onPageChange );
  }

  function onPageChange( page , data )
  {
    if( page == "#dashboardListPage" )
    {
      $( "#titleDashboard" ).text( "" );
      App.View.DashboardList.render( App.Model.Dashboard.dashboards );
    }
    else
    {
      App.View.DashboardList.Modal.close();
    }
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

    var dashboard = new App.Model.Dashboard( dashboardName );
    App.Model.Dashboard.addDashboard( dashboard );

    App.Settings.saveSettings();
    App.View.DashboardList.Modal.close();

    // HACK: Dashboards don't really have an ID yet, so we can use the dashboards array's length
    // to get an "ID"
    openDashboard( App.Model.Dashboard.dashboards.length - 1 );
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
        App.Model.Dashboard.removeDashboard( id );
        App.Settings.saveSettings();
        App.View.DashboardList.render( App.Model.Dashboard.dashboards );
      } );
    }
  }

  function openDashboard( id )
  {
    App.Page.navigateTo( "board/" + id );
  }

  return {
    init : init
  };

} )();
