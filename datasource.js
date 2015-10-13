
var util = require( "util" );
var dashServer = require( "./server" );

module.exports = function(RED)
{
  dashServer.init( RED );

  function Datasource( config )
  {
      RED.nodes.createNode( this, config );

      var self = this;

      this.tstampField = config.tstampField.trim() || "tstamp";
      this.dataField = config.dataField.trim() || "data";
      this.dataComponents = undefined;
      if( config.disableDiscover ) this.dataComponents = null;

      this.clients = [];
      this.currentHistoryRequest = null;
      this.historyRequests = {};

      this.on( "input" , function( msg ) {

        if( !msg.hasOwnProperty( "payload" ) ) return;

        if( typeof msg.payload == "string" && msg.payload == "reset" )
        {
          self.dataComponents = undefined;
          self.sendToAll( JSON.stringify( {
            type : "config",
            id : self.id,
            config : self.getDatasourceConfig()
          } ) );
          return;
        }

        // Deduce(?) data components
        if( self.dataComponents === undefined )
        {
          var dataPoint = util.isArray( msg.payload ) ? msg.payload[0] : msg.payload;
          if( dataPoint.hasOwnProperty( self.dataField ) )
          {
            if( typeof dataPoint[ self.dataField ] === "object" )
            {
              self.dataComponents = [];
              var dataObj = dataPoint[ self.dataField ];
              for( var key in dataObj )
              {
                if( !dataObj.hasOwnProperty( key ) ) continue;
                self.dataComponents.push( key );
              }
            }
            else self.dataComponents = null;
          }

          var configMsg = {
            type : "config",
            id : self.id,
            config : self.getDatasourceConfig()
          };

          self.sendToAll( JSON.stringify( configMsg ) );
        }

        var newData;

        // Historic data request
        if( !self.currentHistoryRequest && self.historyRequests.hasOwnProperty( msg._msgid ) )
        {
          self.currentHistoryRequest = self.historyRequests[ msg._msgid ];
          delete self.historyRequests[ msg._msgid ];
        }

        if( self.currentHistoryRequest )
        {
          newData = {
            type : "history",
            id : self.id,
            cid : self.currentHistoryRequest.cid,
            data : msg.payload
          };
          self.currentHistoryRequest.ws.send( JSON.stringify( newData ) );
          self.currentHistoryRequest = null;
        }
        else
        {
          newData = {
            type : "live",
            id : self.id,
            data : msg.payload
          };
          newData = JSON.stringify( newData );

          // Send live data to all connected clients
          this.sendToAll( newData );
        }

      } );

      this.on( "close" , function() {
        for( var i = 0; i < self.clients.length; i++ )
        {
          self.clients[i].ws.close();
        }
      } );

      // Finds the index of a data point inside an array of data points sorted by unique timestamp
      // If not found, will return the index of the closest data point with timestamp < queried timestamp
      this.findData = function( data , timestamp )
      {
        var min = 0, max = data.length - 1, mid = 0;

        while( max >= min )
        {
          mid = Math.floor( ( min + max ) / 2 );
          if( data[ mid ][ this.tstampField ] == timestamp ) return mid;
          else if( data[ mid ][ this.tstampField ] > timestamp ) max = mid - 1;
          else min = mid + 1;
        }

        return data[ mid ][ this.tstampField ] < timestamp ? mid : mid - 1;
      };

      this.handleHistoryRequest = function( ws , cid , start , end )
      {
        var msg = {
          payload : {
            start : start,
            end : end
          }
        };

        var request = {
          ws : ws,
          cid : cid
        };

        self.currentHistoryRequest = request;
        this.send( msg );
        self.currentHistoryRequest = null;
        this.historyRequests[ msg._msgid ] = request;
      };

      this.addClient = function( client )
      {
        for( var i = 0; i < this.clients.length; i++ )
        {
          if( client.ws == this.clients[i].ws ) return;
        }

        this.clients.push( client );
        var configMsg = {
          type : "config",
          id : this.id,
          config : this.getDatasourceConfig()
        };

        client.ws.send( JSON.stringify( configMsg ) );
      };

      this.removeClient = function( ws )
      {
        for( var i = 0; i < this.clients.length; i++ )
        {
          if( this.clients[i].ws == ws )
          {
            this.clients.splice( i , 1 );
            return;
          }
        }
      };

      this.sendToAll = function( msg )
      {
        for( i = 0; i < this.clients.length; i++ )
        {
          if( this.clients[i].ws.readyState == this.clients[i].ws.CLOSED )
          {
            this.clients.splice( i-- , 1 );
            continue;
          }
          this.clients[i].ws.send( msg );
        }
      };

      this.getDatasourceConfig = function()
      {
        return {
          name : this.name,
          tstampField : this.tstampField,
          dataField : this.dataField,
          dataComponents : this.dataComponents
        };
      };
  }

  RED.nodes.registerType( "iot-datasource", Datasource );
};
