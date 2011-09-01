var vows   = require('vows')
  , assert = require('assert')
  , http   = require('http')
  , fs     = require('fs')
  , Server = require('../lib/server')
  , Client = require('../lib/client')

vows.describe('Server').addBatch({
  'A server' : {
    // Test default host
    'with no host specified' : {
      topic: function () {
        var server = new Server({ port: 9999, path: '/'}, false)
        server.on('testMethod', this.callback)

        // Waits briefly to give the server time to start up and start listening
        setTimeout(function () {
          var options = { host: 'localhost', port: 9999, path: '/' }
          var client = new Client(options, false)
          client.methodCall('testMethod', null, function() { })
        }, 500)
      }
    , 'still responds' : function (error, value) {
        assert.isNull(error)
        assert.deepEqual(value, [])
      }
    }
  }
}).export(module)
