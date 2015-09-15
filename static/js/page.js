
var App = App || {};

App.Page = ( function() {

  var pageChangeCallbacks = [];

  var currentPage = null, currentPageNav = null;
  var isNavigating = false;
  var baseUrl = "/dash/";

  function init()
  {
    baseUrl = $( "base" ).attr( "href" ) || "/dash/";
    navigateTo( location.pathname.replace( baseUrl , "" ) , false );

    window.onpopstate = onPopState;
  }

  function onPopState( event )
  {
    navigateTo( location.pathname.replace( baseUrl , "" ) , false );
  }

  function onPageChange( func )
  {
    pageChangeCallbacks.push( func );
  }

  function finishNavigateTo( newPage , data )
  {
    currentPage = $( newPage );
    currentPageNav = $( newPage + "Nav" );

    currentPage.fadeIn( 200 , function() {
      isNavigating = false;
      currentPageNav.show();
    } );

    for( var i = 0; i < pageChangeCallbacks.length; i++ )
      pageChangeCallbacks[i].call( null , newPage , data );
  }

  function changePage( newPage , data )
  {
    if( isNavigating === true ) return;
    isNavigating = true;

    if( currentPageNav !== null )
    {
      currentPageNav.hide();
    }

    if( currentPage === null )
    {
      finishNavigateTo( newPage , data );
    }
    else
    {
      currentPage.fadeOut( 200 , function() {
        finishNavigateTo( newPage , data );
      } );
    }
  }

  function navigateTo( path , pushState )
  {
    if( pushState || pushState === undefined ) history.pushState( null , "" , path );
    var pathData = path.split( "/" );

    if( pathData[0] == "board" ) changePage( "#dashboardPage" , pathData[1] );
    else changePage( "#dashboardListPage" );
  }

  return {
    init : init,
    onPageChange : onPageChange,
    navigateTo : navigateTo
  };

} )();
