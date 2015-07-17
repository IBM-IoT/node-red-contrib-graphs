
var util = require( "util" );
var dashServer = require( "./server" );
var plugins = require( "./plugins" );
var users = require( "./users" );
var datasources = require( "./datasources" );

module.exports = function(RED)
{
  dashServer.init( RED );

  plugins.init();
  RED.httpNode.use( "/dash/api/plugins" , plugins.app );

  users.init();
  RED.httpNode.use( "/dash/api/user" , users.app );

  datasources.init( RED );
  RED.httpNode.use( "/dash/api/datasources" , datasources.app );

  function Datasource( config )
  {
      RED.nodes.createNode( this, config );

      var self = this;

      this.clients = [];
      this.localHistory = [];
      this.historyMaxLength = config.historyCount;
      this.historyRequests = [];

      this.on( "input" , function( msg ) {

        if( !util.isArray( msg.payload ) || msg.payload.length < 1 ) return;

        var i;
        var newData = {};
        newData[ self.id ] = msg.payload;
        newData = JSON.stringify( newData );

        if( util.isArray( msg.payload[0] ) ) // Array of data points ( historical data )
        {
          // How much of the data can be cached?
          var remainingLength = self.historyMaxLength - self.localHistory.length;
          if( remainingLength > 0 )
          {
            if( remainingLength >= msg.payload.length ) self.localHistory = msg.payload.concat( self.localHistory );
            else self.localHistory = msg.payload.slice( -remainingLength ).concat( self.localHistory );
          }

          // Send historical data to all clients that requested input
          var hreq = self.historyRequests;
          self.historyRequests = [];
          for( i = 0; i < hreq.length; i++ )
          {
            if( hreq[i].ws.readyState == hreq[i].ws.CLOSED ) continue;

            hreq[i].ws.send( newData );
          }
        }
        else // Single data point ( live data )
        {
          self.localHistory.push( msg.payload );
          if( self.localHistory.length > self.historyMaxLength )
          {
            self.localHistory.shift();
          }

          // Send live data to all connected clients
          for( i = 0; i < self.clients.length; i++ )
          {
            if( self.clients[i].ws.readyState == self.clients[i].ws.CLOSED )
            {
              self.clients.splice( i-- , 1 );
              continue;
            }
            self.clients[i].ws.send( newData );
          }
        }

      } );

      this.on( "close" , function() {
        for( var i = 0; i < self.clients.length; i++ )
        {
          self.clients[i].ws.close();
        }
      } );

      this.findData = function( data , timestamp )
      {
        var min = 0, max = data.length - 1, mid = 0;

        while( max >= min )
        {
          mid = Math.floor( ( min + max ) / 2 );
          if( data[ mid ][0] == timestamp ) return mid;
          else if( data[ mid ][0] > timestamp ) max = mid - 1;
          else min = mid + 1;
        }

        return data[ mid ][0] < timestamp ? mid : mid - 1;
      };

      this.handleHistoryRequest = function( client , start , end )
      {
        if( this.localHistory.length > 0 )
        {
          if( start >= this.localHistory[0][0] )
          {
            var startIndex = this.findData( this.localHistory , start ) + 1;
            var endIndex = 0;
            if( end >= this.localHistory[0][0] )
            {
              endIndex = this.findData( this.localHistory , end );
              if( this.localHistory[ endIndex ][0] < end ) endIndex++;
            }
            var newData = {};
            newData[ this.id ] = this.localHistory.slice( endIndex , startIndex );
            client.ws.send( JSON.stringify( newData ) );
            start = this.localHistory[0][0];
          }
        }

        if( start > end )
        {
          this.historyRequests.push( client );
          this.send( { payload : { start : start , end : end } } );
        }
      };

      this.removeClient = function( ws )
      {
        for( var i = 0; i < this.clients.length; i++ )
        {
          if( this.clients[i].ws == ws )
          {
            RED.log.info( "Client removed" );
            this.clients.splice( i , 1 );
            return;
          }
        }
      };
  }

  RED.nodes.registerType( "iot-datasource", Datasource );
};
