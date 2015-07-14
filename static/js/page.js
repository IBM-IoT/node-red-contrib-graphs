
var App = App || {};

App.Page = ( function() {

  var currentPage = null, currentPageNav = null;
  var isNavigating = false;

  function finishNavigateTo( newPage , loadCallback )
  {
    currentPage = $( newPage );
    currentPageNav = $( newPage + "Nav" );

    currentPage.fadeIn( 200 , function() {
      isNavigating = false;
      currentPageNav.show();
    } );

    if( loadCallback && typeof loadCallback == "function" )
    {
      loadCallback();
    }
  }

  function navigateTo( newPage , loadCallback )
  {
    if( isNavigating === true ) return;
    isNavigating = true;

    if( currentPageNav !== null )
    {
      currentPageNav.hide();
    }

    if( currentPage === null )
    {
      finishNavigateTo( newPage , loadCallback );
    }
    else
    {
      currentPage.fadeOut( 200 , function() {
        finishNavigateTo( newPage , loadCallback );
      } );
    }
  }

  return {
    navigateTo : navigateTo
  };

} )();
