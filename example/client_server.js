/**
 * The purpose of this example is to demonstrate an XML-RPC client interacting
 * with an XML-RPC server. Both client and server are using node-xmlrpc.
 *
 * The XML-RPC server is a basic parameter server. It exposes getter and setter
 * methods to get and set different data types. The XML-RPC client can then set
 * and get these values using method calls.
 */

var fs     = require('fs')
  , xmlrpc = require('../lib/xmlrpc.js')


////////////////////////////////////////////////////////////////////////
// The XML-RPC Server
////////////////////////////////////////////////////////////////////////

// To simulate a simple parameter server, where values can be setted and getted
// through XML-RPC, the contents of the calls are stored in an object
var serverContents = {
  calls: []
, arrayValue: null
, booleanValue: null
, dateTimeValue: null
, doubleValue: null
, integerValue: null
, stringValue: null
, structValue: null
}

// Creates an XML-RPC server to listen for XML-RPC method calls
var serverOptions = {
  host: 'localhost'
, port: 9090
}
// Can use a String too:
// var serverOptions = 'http://localhost:9090'
var server = xmlrpc.createServer(serverOptions)

// To use an HTTPS server instead, use createSecureServer:
/*
var secureServerOptions = {
  host: 'localhost'
, port: 443
, key:  fs.readFileSync('./test-key.pem')
, cert: fs.readFileSync('./test-cert.pem')
}
var server = xmlrpc.createSecureServer(secureServerOptions)
*/

// Handle method calls by listening for events with the method call name
// Array handling
// 'setArray' is the method call to listen for

server.on('NotFound', function (methodeName, params) {
  console.log(methodeName+ ' is not found');
})
server.on('setArray', function (err, params, callback) {
  serverContents.calls.push('setArray')
  serverContents.arrayValue = params[0]
  callback()
})
server.on('getArray', function (err, params, callback) {
  serverContents.calls.push('getArray')
  callback(null, serverContents.arrayValue)
})
// Boolean handling
server.on('setBoolean', function (err, params, callback) {
  serverContents.calls.push('setBoolean')
  serverContents.booleanValue = params[0]
  callback()
})
server.on('getBoolean', function (err, params, callback) {
  serverContents.calls.push('getBoolean')
  callback(null, serverContents.booleanValue)
})
// Date handling
server.on('setDate', function (err, params, callback) {
  serverContents.calls.push('setDate')
  serverContents.dateValue = params[0]
  callback()
})
server.on('getDate', function (err, params, callback) {
  serverContents.calls.push('getDate')
  callback(null, serverContents.dateValue)
})
// Double handling
server.on('setDouble', function (err, params, callback) {
  serverContents.calls.push('setDouble')
  serverContents.doubleValue = params[0]
  callback()
})
server.on('getDouble', function (err, params, callback) {
  serverContents.calls.push('getDouble')
  callback(null, serverContents.doubleValue)
})
// Integer handling
server.on('setInteger', function (err, params, callback) {
  serverContents.calls.push('setInteger')
  serverContents.integerValue = params[0]
  callback()
})
server.on('getInteger', function (err, params, callback) {
  serverContents.calls.push('getInteger')
  callback(null, serverContents.integerValue)
})
// String handling
server.on('setString', function (err, params, callback) {
  serverContents.calls.push('setString')
  serverContents.stringValue = params[0]
  callback()
})
server.on('getString', function (err, params, callback) {
  serverContents.calls.push('getString')
  callback(null, serverContents.stringValue)
})
// Struct handling
server.on('setStruct', function (err, params, callback) {
  serverContents.calls.push('setStruct')
  serverContents.structValue = params[0]
  callback()
})
server.on('getStruct', function (err, params, callback) {
  serverContents.calls.push('getStruct')
  callback(null, serverContents.structValue)
})
// Call log handling
server.on('getCallLog', function (err, params, callback) {
  serverContents.calls.push('getCallLog')
  callback(null, serverContents.calls)
})
// Return a fault message
server.on('fakeFault', function (error, params, callback) {
  serverContents.calls.push('fakeFault')
  callback({ faultCode: 2, faultString: 'Uh oh.'}, null)
})


////////////////////////////////////////////////////////////////////////
// The XML-RPC Client
////////////////////////////////////////////////////////////////////////

// Waits briefly to give the XML-RPC server time to start up and start listening
setTimeout(function () {
  // Creates an XML-RPC client. Passes the host information on where to make the
  // XML-RPC calls.
  var clientOptions = {
    host: 'localhost'
  , port: 9090
  , path: '/'
  }
  // Can use a String too:
  // var clientOptions = 'http://localhost:9090'
  var client = xmlrpc.createClient(clientOptions)

  // To use HTTPS to make the call, use createSecureClient instead:
  /*
  var secureClientOptions = {
    host: 'localhost'
  , port: 443
  , path: '/'
  }
  var client = xmlrpc.createSecureClient(secureClientOptions)
  */

  client.methodCall('setArray', [['value1', 'value2']], function(error, value) {
    client.methodCall('getArray', null, function (error, value) {
      console.log('Get Array Response: ' + value)
    })
  })

  client.methodCall('setBoolean', [true], function (error, value) {
    client.methodCall('getBoolean', null, function (error, value) {
      console.log('Get Boolean Response: ' + value)
    })
  })

  client.methodCall('setDate', [new Date(2016, 05, 08, 11, 35, 10)], function (error, value) {
    client.methodCall('getDate', null, function (error, value) {
      console.log('Get Date Response: ' + value)
    })
  })

  client.methodCall('setDouble', [24.99], function (error, value) {
    client.methodCall('getDouble', null, function (error, value) {
      console.log('Get Double Response: ' + value)
    })
  })

  client.methodCall('setInteger', [23], function (error, value) {
    client.methodCall('getInteger', null, function (error, value) {
      console.log('Get Integer Response: ' + value)
    })
  })

  client.methodCall('setString', ['testString1'], function (error, value) {
    client.methodCall('getString', null, function (error, value) {
      console.log('Get String Response: ' + value)
    })
  })

  client.methodCall('setStruct', [{ nameOfValue: 'Go 1998!' }], function (error, value) {
    client.methodCall('getStruct', null, function (error, value) {
      console.log('Get Struct Response (on next line): ')
      console.log(value)
    })
  })

  client.methodCall('fakeFault', null, function (error, value) {
    console.log('Fake Fault Response as Error (on next line): ')
    console.log(error)
  })

  client.methodCall('getCallLog', null, function (error, value) {
    console.log('Get Call Log Response: ' + value)
  })

  client.methodCall('notFound', null, function (error, value) {
    console.log('notFound: '+error);
  });
}, 1000)

