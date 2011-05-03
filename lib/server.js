var http          = require('http')
  , EventEmitter  = require('events').EventEmitter
  , xmlrpcBuilder = require('./xmlrpc-builder.js')
  , xmlrpcParser  = require('./xmlrpc-parser.js')

/**
 * Creates a new Server object. Also creates an HTTP server to start
 * listening for XML-RPC method calls. Will emit an event with the
 * XML-RPC call's method name when receiving a method call.
 *
 * @constructor
 * @param {Object}options - the HTTP server options
 *   - {String} host
 *   - {Number} port
 * @return {Server}
 */
function Server(options) {

  // Invokes with new if called without
  if (false === (this instanceof Server)) {
    return new Server(options)
  }

  // Will need to reference this's emit
  var that = this

  // Creates server and start listening for request
  http.createServer(function (request, response) {

    // When receives data, parse call and emit an event
    request.on('data', function (chunk) {
      handleMethodCall(chunk)
    })

    // Emit the call event for the method
    var handleMethodCall = function(xml) {
      xmlrpcParser.parseMethodCall(xml, function(err, method, params) {
        that.emit(method, null, params, handleMethodResponse)
      })
    }
    // Handle the response to the caller
    var handleMethodResponse = function(err, value) {
      xmlrpcBuilder.buildMethodResponse(value, function (err, xml) {
        response.writeHead(200, {'Content-Type': 'text/xml'});
        response.end(xml)
      })
    }

  }).listen(options.port, options.host);
}

// Inherit from EventEmitter to emit and listen
Server.prototype.__proto__ = EventEmitter.prototype

module.exports = Server

