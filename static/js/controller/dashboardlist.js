
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

    var dashboard = new App.Model.Dashboard( dashboardName );
    App.Model.Dashboard.addDashboard( dashboard );

    App.Settings.saveSettings();
    App.View.DashboardList.Modal.close();
    openDashboard( dashboard );
  }

  function dashboardButtonClick()
  {
    var id = $( this ).attr( "data-open" );
    if( id !== undefined )
    {
      var dashboard = App.Model.Dashboard.getDashboard( id );
      openDashboard( dashboard );
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

  function openDashboard( dashboard )
  {
    if( !dashboard ) return;
    App.Net.createConnection().done( function() {
      App.Page.navigateTo( "#dashboardPage" , function() {
        App.Controller.Dashboard.loadDashboard( dashboard );
      } );
    } );
  }

  return {
    init : init
  };

} )();
