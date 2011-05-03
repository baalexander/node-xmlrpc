var http   = require('http')
  , xmlrpc = require('../lib/node-xmlrpc.js')

var server = xmlrpc.createServer({ host: 'localhost', port: 11311 })
server.on('getSystemState', function (err, params, callback) {
  callback(null, 'goodluck!')
})


setTimeout(function () {
  var client = xmlrpc.createClient({ host: 'localhost', port: 11311, path: '/'})
  client.call('getSystemState', '/', function (err, value) {
    console.log('Response from call: ' + value)
  })
}, 1000)

/*var client = xmlrpc.createClient({ host: 'localhost', port: 11311, path: '/'})
//client.call('dosomething', ['param1', 2, 2.2, true, false, ['a', 'b', 'c'], { a: 'objparam1', b2: 'objectparam2' }, null, new Date()], function () { })
client.call('getSystemState', '/', function (err, value) {
  console.log(value)
})*/


