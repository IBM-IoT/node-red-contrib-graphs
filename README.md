# node-red-contrib-graphs

A Node-RED graphing package. Contains a datasource node which handles historical data and live data streams, and a hackable visualization application designed to connect to the datasource nodes.

# Install

Within your local installation of Node-RED run:

`npm install node-red-contrib-graphs`

Once installed, the datasource node will be available in Node-RED (*iot-datasource*) under the *GatewayKit* category. The dashboard web application will also start being served at http://localhost:1880/dash/ (by default)

# Node-RED Datasource node

This node is designed to accept data (live or historical) in a certain format and send it to the dashboard application included in this package.

The node expects each datapoint to be a JSON Object that contains a UNIX timestamp field (default: `msg.payload.tstamp`) and a data field (default: `msg.payload.data`).

The datasource node can be configured, however, to look for these values anywhere within `msg.payload`.

For example, if the incoming JSON looks something like this...
```
msg.payload = {
  myData: {
    myTimestamp: 1438637044000,
    myInnerData: {
      x: 3.14
    }
  }
}
```
...the node will be able to access it as long as you configure its timestamp field to `msg.payload.myData.myTimestamp` and its data field to `msg.payload.myData.myInnerData.x`

The node is also able to parse JSON Object data. For example, if your data looks something like this...
```
msg.payload = {
  tstamp: 1438637044000,
  data: {
    x: 3.14,
    y: 1.41,
    z: 6.02
  }
}
```
...and the node is configured to look for data in `msg.payload.data`, the node will automatically go inside the object, and find `x`, `y`, and `z`, and present them to the dashboard application as "subcomponents." The dashboard application can then choose which subcomponents to graph. If you need this behavior disabled, if you need the JSON Object kept intact, check the *Disable subcomponent discovery* option in the node's configuration.

*Note: The subcomponent discovery process happens when the first data point is received. If the format of the data changes after that, the node won't register the change.*

*Note: Until the node receives its first data point, the node is considered uninitialized. Charts referencing this datasource won't load.*

There is one key different between historical and live data, without which the node wouldn't be able to tell them apart (for now).
Live data is expected to come in as single data points...
```
msg.payload = {
  tstamp: 1438637044000,
  data: 20.0
}
```
...while historical data is expected as an array of data points, ordered by timestamp, in ascending order.
```
msg.payload = [ ...
  {
    tstamp: 1438637044000,
    data: 20.0
  },
  {
    tstamp: 1438637045000,
    data: 25.0
  }
... ]
```
In order to allow the dashboard applications to make requests for historical data, the datasource node has the ability to output a JSON object containing start and end timestamps on request.
```
msg.payload = {
  start: 1438637044000,
  end: 1438638044000
}
```
This output can then be sent through a flow designed to retrieve historical information within the requested timestamps, and feed it back into the datasource node through a loop.

*Note: It is important that the flow retrieving historical data does not re-create the message. It must only modify it! Otherwise, the request will fail.*

***Examples*** *(Node-RED flows)*

*Live data*
```
[{"id":"891b3e25.76e4c","type":"inject","name":"","topic":"","payload":"","payloadType":"date","repeat":"1","crontab":"","once":false,"x":313,"y":132,"z":"5b17c53d.a4e83c","wires":[["64a9bc70.9b5644"]]},{"id":"64a9bc70.9b5644","type":"function","name":"Random Data","func":"var now = ( new Date() ).getTime();\nvar value = Math.floor( Math.random() * 100 );\nmsg.payload = {\n    tstamp: now,\n    data: value\n};\nreturn msg;","outputs":1,"noerr":0,"x":555,"y":132,"z":"5b17c53d.a4e83c","wires":[["9c566cfe.63a99"]]},{"id":"9c566cfe.63a99","type":"iot-datasource","name":"Random Datasource","tstampField":"","dataField":"","disableDiscover":false,"x":843,"y":134,"z":"5b17c53d.a4e83c","wires":[[]]}]
```

*Live & historical data*
```
[{"id":"cca5fe7a.335a","type":"inject","name":"","topic":"","payload":"","payloadType":"date","repeat":"1","crontab":"","once":false,"x":287,"y":175,"z":"5b17c53d.a4e83c","wires":[["37e83d85.c817c2"]]},{"id":"37e83d85.c817c2","type":"function","name":"Random Data","func":"var now = ( new Date() ).getTime();\nvar value = Math.floor( Math.random() * 100 );\nmsg.payload = {\n    tstamp: now,\n    data: value\n};\nreturn msg;","outputs":1,"noerr":0,"x":529,"y":175,"z":"5b17c53d.a4e83c","wires":[["adfd9b1a.520268"]]},{"id":"adfd9b1a.520268","type":"iot-datasource","name":"Random Datasource","tstampField":"","dataField":"","disableDiscover":false,"x":818,"y":175,"z":"5b17c53d.a4e83c","wires":[["17605e.ffe89fa2"]]},{"id":"17605e.ffe89fa2","type":"function","name":"Random History","func":"// Get request timestamps\nvar start = msg.payload.start;\nvar end = msg.payload.end;\n\nvar data = [];\nfor( var ts = start; ts < end; ts += 1000 )\n{\n    var value = Math.floor( Math.random() * 100 );\n    data.push( {\n        tstamp: ts,\n        data: value\n    } );\n}\nmsg.payload = data;\nreturn msg;","outputs":1,"noerr":0,"x":814,"y":278,"z":"5b17c53d.a4e83c","wires":[["adfd9b1a.520268"]]}]
```

*Multiple datasources*
```
[{"id":"83c0be0c.7c3f4","type":"inject","name":"","topic":"","payload":"","payloadType":"date","repeat":"1","crontab":"","once":false,"x":341,"y":157,"z":"5b17c53d.a4e83c","wires":[["1c86e948.e37917"]]},{"id":"1c86e948.e37917","type":"function","name":"Random Data","func":"var now = ( new Date() ).getTime();\nvar value = Math.floor( Math.random() * 100 );\nmsg.payload = {\n    tstamp: now,\n    data: value\n};\nreturn msg;","outputs":1,"noerr":0,"x":583,"y":157,"z":"5b17c53d.a4e83c","wires":[["9d399bc.f62c668"]]},{"id":"9d399bc.f62c668","type":"iot-datasource","name":"Random Datasource","tstampField":"","dataField":"","disableDiscover":false,"x":872,"y":157,"z":"5b17c53d.a4e83c","wires":[[]]},{"id":"f28351b4.0d7cb","type":"inject","name":"","topic":"","payload":"","payloadType":"date","repeat":"1","crontab":"","once":false,"x":340,"y":204,"z":"5b17c53d.a4e83c","wires":[["8fd198d.f702e68"]]},{"id":"8fd198d.f702e68","type":"function","name":"Random Data","func":"var now = ( new Date() ).getTime();\nvar value = Math.floor( Math.random() * 50 ) + 25;\nmsg.payload = {\n    tstamp: now,\n    data: value\n};\nreturn msg;","outputs":1,"noerr":0,"x":582,"y":204,"z":"5b17c53d.a4e83c","wires":[["4d6ef8ec.b29108"]]},{"id":"4d6ef8ec.b29108","type":"iot-datasource","name":"Random Datasource 2","tstampField":"","dataField":"","disableDiscover":false,"x":871,"y":204,"z":"5b17c53d.a4e83c","wires":[[]]}]
```

*Custom JSON Object & Subcomponent Discovery*

(Best viewed with a Line/Area Graph)
```
[{"id":"5bbde735.a44218","type":"inject","name":"","topic":"","payload":"","payloadType":"date","repeat":"1","crontab":"","once":false,"x":206,"y":198,"z":"5b17c53d.a4e83c","wires":[["2e833127.d17cce"]]},{"id":"2e833127.d17cce","type":"function","name":"Random Data","func":"var now = ( new Date() ).getTime();\nvar value = Math.floor( Math.random() * 100 );\nmsg.payload = {\n    myTimestamp: now,\n    myInnerData: {\n        x : value,\n        y : value + 100,\n        z : value - 100\n    }\n};\nreturn msg;","outputs":1,"noerr":0,"x":448,"y":198,"z":"5b17c53d.a4e83c","wires":[["e7879b6c.187868"]]},{"id":"e7879b6c.187868","type":"iot-datasource","name":"Random Datasource","tstampField":"myTimestamp","dataField":"myInnerData","disableDiscover":false,"x":736,"y":200,"z":"5b17c53d.a4e83c","wires":[[]]}]
```

# Dashboard

The dashboard application packaged with the node can be accessed at http://localhost:1880/dash (default)

On the main screen, you can create a new dashboard, or access/remove existing dashboards. Each dashboard contains its own set of charts. Once you create a new dashboard or open an existing one, you can create/edit/remove charts within that dashboard.

All chart types in this application are plugins. These plugins are located in the `plugins/` folder. Any `.html` files inside the plugins folder, or any subfolders, will be automatically loaded.

When creating a new chart, any datasource nodes deployed in Node-RED will be available to select.
For example, if you've tried out one of the example flows included above, when creating a new chart, the datasource "Random Datasource" will be available. If not, make sure the flow was deployed or try refreshing the dashboard page.
