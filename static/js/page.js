
var App = App || {};

App.Page = ( function() {

  var currentPage = null;
  var isNavigating = false;

  function finishNavigateTo( newPage , loadCallback )
  {
    currentPage = $( newPage );
    currentPage.fadeIn( 200 , function() {
      isNavigating = false;
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
