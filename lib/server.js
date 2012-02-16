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

  // Select HTTP or HTTPS server
  var httpServer = null
  if (isSecure === true) {
    httpServer = https.createServer(options)
  }
  else {
    httpServer = http.createServer()
  }

  // Listen for method calls
  httpServer.on('request', function(request, response) {
    request.setEncoding('utf8')

    var hasReceivedData = false
    request.on('data', function(chunk) {
      // The first time data is received, start the parser
      if (!hasReceivedData) {
        hasReceivedData = true
        // Parse the method call for a method name and params
        xmlrpcParser.parseMethodCall(chunk, function(error, methodName, params) {

          // Emit the method name and params from the method call
          that.emit(methodName, null, params, function(error, value) {

            // If an error, respond with a fault message
            if (error !== null) {
              xmlrpcBuilder.buildMethodResponseWithAFault(error, function (error, xml) {
                response.writeHead(200, {'Content-Type': 'text/xml'})
                response.end(xml)
              })
            }
            // Respond with the method response
            else {
              xmlrpcBuilder.buildMethodResponse(value, function (error, xml) {
                response.writeHead(200, {'Content-Type': 'text/xml'})
                response.end(xml)
              })
            }
          })
        })
      }
      // Any subsequent data received is fed into the parser
      else {
        xmlrpcParser.write(chunk)
      }
    })

    request.on('end', function(chunk) {
      xmlrpcParser.close()
    })
  })

  httpServer.listen(options.port, options.host)
}

// Inherit from EventEmitter to emit and listen
Server.prototype.__proto__ = EventEmitter.prototype

module.exports = Server

