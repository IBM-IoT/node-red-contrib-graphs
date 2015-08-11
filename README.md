# node-red-contrib-graphs

A Node-RED graphing package. Contains a datasource node which handles historical data and live data streams, and a hackable visualization application designed to connect to the datasource nodes.

# Install

Within your local installation of Node-RED run:

`npm install node-red-contrib-graphs`

Once installed, the datasource node will be available in Node-RED (*iot-datasource*) under the *GatewayKit* category. The dashboard web application will also start being served at http://localhost:1880/dash/ (by default)

# Node-RED Datasource node

This node is designed to accept data (live or historical) in a certain format and send it to the dashboard application included in this package.

The node expects each datapoint to be a JSON Object that contains a UNIX timestamp field (default: `msg.payload.tstamp`) and a data field (default: `msg.payload.data`).

```
msg.payload = {
  tstamp: 1438637044000,
  data: 20.0
}
```

It can also accept an array of datapoints, as long as they are given in ascending order, by timestamp.

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

In order to allow the dashboard applications to make requests for historical data, the datasource node has the ability to output a JSON object containing start and end timestamps on request. This output can be used to retrieve historical information within the requested timestamps, and feed it back into the node through a loop.

***Examples*** *(Node-RED flows)*

*Live data*
```
[{"id":"d4df415.f2b20c","type":"inject","name":"","topic":"","payload":"","payloadType":"date","repeat":"1","crontab":"","once":false,"x":227,"y":224,"z":"e7f849bf.1807b8","wires":[["c8755d9e.378aa"]]},{"id":"c8755d9e.378aa","type":"function","name":"Random Data","func":"var now = ( new Date() ).getTime();\nvar value = Math.floor( Math.random() * 100 );\nmsg.payload = {\n    tstamp: now,\n    data: value\n};\nreturn msg;","outputs":1,"noerr":0,"x":469,"y":224,"z":"e7f849bf.1807b8","wires":[["23eecf7e.dc113"]]},{"id":"23eecf7e.dc113","type":"iot-datasource","name":"Random Datasource","historyCount":100,"tstampField":"","dataField":"","x":757,"y":226,"z":"e7f849bf.1807b8","wires":[[]]}]
```

*Live & historical data*
```
[{"id":"bb6a2f7d.4495d","type":"inject","name":"","topic":"","payload":"","payloadType":"date","repeat":"1","crontab":"","once":false,"x":236,"y":202,"z":"e7f849bf.1807b8","wires":[["8d6e3f51.7291c"]]},{"id":"8d6e3f51.7291c","type":"function","name":"Random Data","func":"var now = ( new Date() ).getTime();\nvar value = Math.floor( Math.random() * 100 );\nmsg.payload = {\n    tstamp: now,\n    data: value\n};\nreturn msg;","outputs":1,"noerr":0,"x":478,"y":202,"z":"e7f849bf.1807b8","wires":[["cd3a303.f32c5d"]]},{"id":"cd3a303.f32c5d","type":"iot-datasource","name":"Random Datasource","historyCount":100,"tstampField":"","dataField":"","x":767,"y":202,"z":"e7f849bf.1807b8","wires":[["5b93aff2.a46c5"]]},{"id":"5b93aff2.a46c5","type":"function","name":"Random History","func":"// Get request timestamps\nvar start = msg.payload.start;\nvar end = msg.payload.end;\n\nvar data = [];\nfor( var ts = start; ts < end; ts += 1000 )\n{\n    var value = Math.floor( Math.random() * 100 );\n    data.push( {\n        tstamp: ts,\n        data: value\n    } );\n}\nmsg.payload = data;\nreturn msg;","outputs":1,"noerr":0,"x":763,"y":305,"z":"e7f849bf.1807b8","wires":[["cd3a303.f32c5d"]]}]
```

*Multiple datasources*
```
[{"id":"bb6a2f7d.4495d","type":"inject","name":"","topic":"","payload":"","payloadType":"date","repeat":"1","crontab":"","once":false,"x":236,"y":202,"z":"e7f849bf.1807b8","wires":[["8d6e3f51.7291c"]]},{"id":"8d6e3f51.7291c","type":"function","name":"Random Data","func":"var now = ( new Date() ).getTime();\nvar value = Math.floor( Math.random() * 100 );\nmsg.payload = {\n    tstamp: now,\n    data: value\n};\nreturn msg;","outputs":1,"noerr":0,"x":478,"y":202,"z":"e7f849bf.1807b8","wires":[["cd3a303.f32c5d"]]},{"id":"cd3a303.f32c5d","type":"iot-datasource","name":"Random Datasource","historyCount":100,"tstampField":"","dataField":"","x":767,"y":202,"z":"e7f849bf.1807b8","wires":[[]]},{"id":"b1c707fb.4e38f8","type":"inject","name":"","topic":"","payload":"","payloadType":"date","repeat":"1","crontab":"","once":false,"x":235,"y":249,"z":"e7f849bf.1807b8","wires":[["e870a5f0.178f58"]]},{"id":"e870a5f0.178f58","type":"function","name":"Random Data","func":"var now = ( new Date() ).getTime();\nvar value = Math.floor( Math.random() * 50 ) + 25;\nmsg.payload = {\n    tstamp: now,\n    data: value\n};\nreturn msg;","outputs":1,"noerr":0,"x":477,"y":249,"z":"e7f849bf.1807b8","wires":[["b10813f0.4ef7f"]]},{"id":"b10813f0.4ef7f","type":"iot-datasource","name":"Random Datasource 2","historyCount":100,"tstampField":"","dataField":"","x":766,"y":249,"z":"e7f849bf.1807b8","wires":[[]]}]
```

# Dashboard

The dashboard application packaged with the node can be accessed at http://localhost:1880/dash (default)

On the main screen, you can create a new dashboard, or access/remove existing dashboards. Each dashboard contains its own set of charts. Once you create a new dashboard or open an existing one, you can create/edit/remove charts within that dashboard.

All chart types in this application are plugins. The two plugins currently available are two line chart examples using two different external libraries: *dygraph* (http://dygraphs.com/) and *nvd3* (http://nvd3.org/).
These plugins are located in the `plugins/` folder. Any `.html` files inside the plugins folder, or any subfolders, will be automatically loaded.

When creating a new chart, any datasource nodes deployed in Node-RED will be available to select.
For example, if you've tried out one of the example flows included above, when creating a new chart, the datasource "Random Datasource" will be available. If not, make sure the flow was deployed or try refreshing the dashboard page.
