## The What

The xmlrpc module is a pure JavaScript XML-RPC server and client for node.js.

Pure JavaScript means that the [XML
parsing](https://github.com/robrighter/node-xml) and [XML
building](https://github.com/robrighter/node-xml) use pure JavaScript libraries,
so no extra C dependencies or build requirements. The xmlrpc module can be used
as an XML-RPC server, receiving method calls and responding with method
responses, or as an XML-RPC client, making method calls and receiving method
responses, or as both.

## The How

### To Install

```bash
npm install xmlrpc
```

### To Use

The client-server.js in the example directory has an nicely commented example of
using xmlrpc as an XML-RPC server and client (they even talk to each other!).

A brief example:

```javascript
var xmlrpc = require('xmlrpc')

// Creates an XML-RPC server to listen to XML-RPC method calls
var server = xmlrpc.createServer({ host: 'localhost', port: 9090 })

// Handle method calls by listening for events with the method call name
server.on('anAction', function (err, params, callback) {
  console.log('Method call params for \'anAction\': ' + params)

  // ...perform an action...

  // Send a method response with a value
  callback(null, 'aResult')
})
console.log('XML-RPC server listening on port 9091')

// Waits briefly to give the XML-RPC server time to start up and start
// listening
setTimeout(function () {
  // Creates an XML-RPC client. Passes the host information on where to
  // make the XML-RPC calls.
  var client = xmlrpc.createClient({ host: 'localhost', port: 9090, path: '/'})

  // Sends a method call to the XML-RPC server
  client.methodCall('anAction', ['aParam'], function (error, value) {
    // Results of the method response
    console.log('Method response for \'anAction\': ' + value)
  })

}, 1000)
```

Output from the example:

```
XML-RPC server listening on port 9090
Method call params for 'anAction': aParam
Method response for 'anAction': aResult
```

### To Test

As XML-RPC must be precise so there are an extensive set of test cases in the test directory. [Vows](http://vowsjs.org/) is used for testing.

To run (from node-xmlrpc root directory):

`vows --spec test/*.js`

If submitting a bug fix, please update the appropriate test file too.

## The License (MIT)

Released under the MIT license. See the LICENSE file for the complete wording.

