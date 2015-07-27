
var App = App || {};

App.Modal = ( function() {

  function show( title , content , yesCallback , cancelCallback )
  {
    var template = $.templates( "#tmpl_Modal" );
    var $modal = $( template.render( {
      title : title,
      content : content
    } ) );

    $( "body" ).append( $modal );

    $modal.on( "hidden.bs.modal" , function() {
      if( typeof cancelCallback === "function" )
      {
        cancelCallback();
      }
      $( this ).remove();
    } );

    $( "#dynamicModalYes" ).on( "click" , function() {
      if( typeof yesCallback === "function" )
      {
        yesCallback();
      }
      $modal.modal( "hide" );
    } );

    $modal.modal();
  }

  return {
    show : show
  };

} )();
