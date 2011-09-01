var http          = require('http')
  , https         = require('https')
  , url           = require('url')
  , EventEmitter  = require('events').EventEmitter
  , xmlrpcBuilder = require('./xmlrpc-builder.js')
  , xmlrpcParser  = require('./xmlrpc-parser.js')

/**
 * Creates a new Server object. Also creates an HTTP server to start listening
 * for XML-RPC method calls. Will emit an event with the XML-RPC call's method
 * name when receiving a method call.
 *
 * @constructor
 * @param {Object|String} options - The HTTP server options. Either a URI string
 *                                  (e.g. 'http://localhost:9090') or an object
 *                                  with fields:
 *   - {String} host              - (optional)
 *   - {Number} port
 * @param {Boolean} isSecure      - True if using https for making calls,
 *                                  otherwise false.
 * @return {Server}
 */
function Server(options, isSecure) {

  if (false === (this instanceof Server)) {
    return new Server(options, isSecure)
  }

  var that = this

  // If a string URI is passed in, converts to URI fields
  if (typeof options === 'string') {
    options = url.parse(options)
    options.host = options.hostname
    options.path = options.pathname
  }

  var requestListener = function(request, response) {
    // When receives data, parse call and emit an event
    request.on('data', function (chunk) {
      handleMethodCall(chunk)
    })

    // Emit the call event for the method
    var handleMethodCall = function(xml) {
      xmlrpcParser.parseMethodCall(xml, function(error, method, params) {
        that.emit(method, null, params, handleMethodResponse)
      })
    }
    // Handle the response to the caller
    var handleMethodResponse = function(error, value) {
      if (error !== null) {
        xmlrpcBuilder.buildMethodResponseWithAFault(error, function (error, xml) {
          response.writeHead(200, {'Content-Type': 'text/xml'})
          response.end(xml)
        })
      }
      else {
        xmlrpcBuilder.buildMethodResponse(value, function (error, xml) {
          response.writeHead(200, {'Content-Type': 'text/xml'})
          response.end(xml)
        })
      }
    }
  }

  var httpServer = null
  if (isSecure === true) {
    httpServer = https.createServer(options, requestListener)
  }
  else {
    httpServer = http.createServer(requestListener)
  }

  httpServer.listen(options.port, options.host)
}

// Inherit from EventEmitter to emit and listen
Server.prototype.__proto__ = EventEmitter.prototype

module.exports = Server

