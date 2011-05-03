var http          = require('http')
  , EventEmitter  = require('events').EventEmitter
  , xmlrpcBuilder = require('./xmlrpc-builder.js')
  , xmlrpcParser  = require('./xmlrpc-parser.js')

function Server(options) {

  // Invokes with new if called without
  if (false === (this instanceof Server)) {
    return new Server(options)
  }

  var that = this

  http.createServer(function (req, res) {
    req.on('data', function (chunk) {
      xmlrpcParser.parseMethodCall(chunk, function(err, method, params) {
        that.emit(method, null, params, function (err, value) {
          xmlrpcBuilder.buildMethodResponse(value, function (err, responseXml) {
            res.writeHead(200, {'Content-Type': 'text/xml'});
            res.end(responseXml)
          })
        })
      })
    })
  }).listen(options.port, options.host);

}

Server.prototype.__proto__ = EventEmitter.prototype


// Listen for data from http server
// When gets data (on('data')), 
//   parse
//   emit on result's method name, passing params

module.exports = Server

