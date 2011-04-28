var http   = require('http')
  , xmlrpc = require('../lib/node-xmlrpc.js')

http.createServer(function (req, res) {

}).listen(3000, 'localhost')

var client = xmlrpc.createClient()
console.log(client)
client.call('dosomething', ['param1', 2, 2.2, true, false, ['a', 'b', 'c'], { a: 'objparam1', b2: 'objectparam2' }, null, new Date()], function () { })
console.log('Started the XMLRPC test client')

