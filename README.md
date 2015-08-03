# node-red-contrib-graphs

A Node-RED graphing package. Contains a datasource node which handles historical data and live data streams, and a hackable visualization application designed to connect to the datasource nodes.

# Install

Within your local installation of Node-RED run:

`npm install node-red-contrib-graphs`

Once installed, the datasource node will be available in Node-RED (*iot-datasource*) under the *GatewayKit* category. The dashboard web application will also start being served at http://localhost:1880/dash/ (by default)

# Node-RED Datasource node

This node is designed to accept data (live or historical) in a certain format and send it to the dashboard application included in this package.

The node expects each datapoint as an 2-element array where the 1st element is a unix timestamp in milliseconds, and the 2nd element a numerical value (planned to change).

`[ 1438637044000 , 20.0 ]`

It can also accept an array of datapoints, as long as they are in ascending order, by timestamp.

`[[ 1438637044000 , 20.0 ],[ 1438637045000 , 25.0 ],...]`

In order to allow the dashboard applications to make requests for historical data, the datasource node has the ability to output a JSON object containing start and end timestamps on request. This output can be used to retrieve historical information within the requested timestamps, and feed it back into the node through a loop.

***Examples*** *(Node-RED flows)*

*Live data*
```
[{"id":"859cc15b.7a634","type":"inject","name":"","topic":"","payload":"","payloadType":"date","repeat":"1","crontab":"","once":false,"x":254,"y":222,"z":"e7f849bf.1807b8","wires":[["50d9a7ec.af2658"]]},{"id":"50d9a7ec.af2658","type":"function","name":"Random Data","func":"var now = ( new Date() ).getTime();\nvar value = Math.floor( Math.random() * 100 );\nmsg.payload = [ now , value ];\nreturn msg;","outputs":1,"noerr":0,"x":496,"y":222,"z":"e7f849bf.1807b8","wires":[["38000cde.c7fff4"]]},{"id":"38000cde.c7fff4","type":"iot-datasource","name":"Random Datasource","historyCount":100,"x":784,"y":224,"z":"e7f849bf.1807b8","wires":[[]]}]
```

*Live & historical data*
```
[{"id":"859cc15b.7a634","type":"inject","name":"","topic":"","payload":"","payloadType":"date","repeat":"1","crontab":"","once":false,"x":254,"y":222,"z":"e7f849bf.1807b8","wires":[["50d9a7ec.af2658"]]},{"id":"50d9a7ec.af2658","type":"function","name":"Random Data","func":"var now = ( new Date() ).getTime();\nvar value = Math.floor( Math.random() * 100 );\nmsg.payload = [ now , value ];\nreturn msg;","outputs":1,"noerr":0,"x":496,"y":222,"z":"e7f849bf.1807b8","wires":[["38000cde.c7fff4"]]},{"id":"38000cde.c7fff4","type":"iot-datasource","name":"Random Datasource","historyCount":100,"x":785,"y":222,"z":"e7f849bf.1807b8","wires":[["263e85c8.d9c17a"]]},{"id":"263e85c8.d9c17a","type":"function","name":"Random History","func":"// Get request timestamps\nvar start = msg.payload.start;\nvar end = msg.payload.end;\n\nvar data = [];\nfor( var ts = start; ts < end; ts += 1000 )\n{\n    var value = Math.floor( Math.random() * 100 );\n    data.push( [ ts , value ] );\n}\nmsg.payload = data;\nreturn msg;","outputs":1,"noerr":0,"x":781,"y":325,"z":"e7f849bf.1807b8","wires":[["38000cde.c7fff4"]]}]
```

# Dashboard

The dashboard application packaged with the node can be accessed at http://localhost:1880/dash (default)

On the main screen, you can create a new dashboard, or access/remove existing dashboards. Each dashboard contains its own set of charts. Once you create a new dashboard or open an existing one, you can create/edit/remove charts within that dashboard.

All chart types in this application are plugins. The two plugins currently available are two line chart examples using two different external libraries: *dygraph* (http://dygraphs.com/) and *nvd3* (http://nvd3.org/).
These plugins are located in the `plugins/` folder. Any `.html` files inside the plugins folder, or any subfolders, will be automatically loaded.

When creating a new chart, any datasource nodes deployed in Node-RED will be available to select.
For example, if you've tried out one of the example flows included above, when creating a new chart, the datasource "Random Datasource" will be available. If not, make sure the flow was deployed or try refreshing the dashboard page.
