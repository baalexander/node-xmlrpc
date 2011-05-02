var http   = require('http')
  , xmlrpc = require('../lib/node-xmlrpc.js')

var client = xmlrpc.createClient({ host: 'localhost', port: 11311, path: '/'})
//client.call('dosomething', ['param1', 2, 2.2, true, false, ['a', 'b', 'c'], { a: 'objparam1', b2: 'objectparam2' }, null, new Date()], function () { })
client.call('getSystemState', '/', function (err, params) {
  console.log(params)
})


