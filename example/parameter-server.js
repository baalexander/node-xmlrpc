var http   = require('http')
  , xmlrpc = require('../lib/node-xmlrpc.js')


var server = xmlrpc.createServer({ host: 'localhost', port: 11311 })
server.on('dosomething', function (err, params) {
  console.log(params)
})

console.log('listening to localhost:8090')

