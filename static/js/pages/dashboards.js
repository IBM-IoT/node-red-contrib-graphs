
var App = App || {};
App.Pages = App.Pages || {};

App.Pages.Dashboards = ( function() {

  function dashButtonClick()
  {
    var id = $( this ).attr( "data-dash" );
    var dashboard = App.Dashboard.getDashboard( id );
    if( dashboard === null ) return;

    App.Net.createConnection().done( function() {
      App.Page.navigateTo( "#chartsPage" , function() {
        App.Pages.Charts.loadDashboard( dashboard );
      } );
    } );
  }

  function populateDashboardList( dashboards )
  {
    var $container = $( "#dashboardPage" );
    $container.empty();

    if( dashboards.length > 0 )
    {
      for( var i = 0; i < dashboards.length; i++ )
      {
        $container.append( '<p><button type="button" class="btn btn-default" data-dash="' + i + '">' + dashboards[i].name + '</button></p>' );
      }

      $container.find( "button" ).on( "click" , dashButtonClick );
    }
    else
    {
      $container.append( '<div class="alert alert-info">No dashboards available.</div>' );
    }
  }

  return {
    populateDashboardList : populateDashboardList
  };

} )();
