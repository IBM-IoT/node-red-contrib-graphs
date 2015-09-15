
var App = App || {};
App.View = App.View || {};

App.View.Status = ( function() {

  function set( msg )
  {
    var time = ( new Date() ).toLocaleTimeString();
    $( "#statusBarMessage" ).text( "[" + time + "] " + msg );
  }

  function clear()
  {
    $( "#statusBarMessage" ).html( "&nbsp;" );
  }

  function setConnected( connected )
  {
    var $target = $( ".statusBarConnect" );
    if( connected ) $target.addClass( "connected" );
    else $target.removeClass( "connected" );
  }

  return {
    set : set,
    clear : clear,
    setConnected : setConnected
  };

} )();
