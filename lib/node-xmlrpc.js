var Client = require('./client')
  , Server = require('./server')

var xmlrpc = exports;

xmlrpc.createClient = function(http) {
  return new Client(http)
}

xmlrpc.createServer = function(options) {
  return new Server(options)
}

