
var App = App || {};

App.Page = ( function() {

  var pageChangeCallbacks = [];

  var currentPage = null, currentPageNav = null;
  var isNavigating = false;

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

  function navigateTo( newPage , data )
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

  return {
    onPageChange : onPageChange,
    navigateTo : navigateTo
  };

} )();
