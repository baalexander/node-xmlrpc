var vows   = require('vows')
  , assert = require('assert')
  , http   = require('http')
  , fs     = require('fs')
  , Server = require('../lib/server')
  , Client = require('../lib/client')

vows.describe('Server').addBatch({
  'A constructor' : {
    // Test string parameter for options
    'with a string URI for options' : {
      topic: function () {
        var server = new Server('http://localhost:9005', false)
        server.on('testMethod', this.callback)

        // Waits briefly to give the server time to start up and start listening
        setTimeout(function () {
          var options = { host: 'localhost', port: 9005, path: '/' }
          var client = new Client(options, false)
          client.methodCall('testMethod', null, function() { })
        }, 500)
      }
    , 'still responds' : function (error, value) {
        assert.isNull(error)
        assert.deepEqual(value, [])
      }
    }
    // Test default host
  , 'with no host specified' : {
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
//////////////////////////////////////////////////////////////////////
// Test method call functionality
//////////////////////////////////////////////////////////////////////
, 'A method call' : {
    // Test chunked request
    'with a chunked request' : {
      topic: function () {
        var server = new Server({ port: 9998, path: '/'}, false)
        server.on('testMethod', this.callback)

        // Waits briefly to give the server time to start up and start listening
        setTimeout(function () {
          var options = { host: 'localhost', port: 9998, path: '/',
                          method: 'POST' }
          var req = http.request(options, function() {})
          var chunk1 = '<?xml version="1.0" encoding="UTF-8"?>'
            + '<methodCall>'
            + '<methodName>testMethod</methodName>'
            + '<params>'
            + '<param>'
            + '<value><string>Param A</string></value>'
            + '</param>'
            + '<param>'
          var chunk2 = '<value><string>Param B</string></value>'
            + '</param>'
            + '</params>'
            + '</methodCall>'
          req.on('error', function(e) {
            assert.isNull(e)
          })
          req.write(chunk1)
          req.write(chunk2)
          req.end()
        }, 500)
      }
    , 'contains all the parameters' : function (error, value) {
        assert.isNull(error)
        assert.deepEqual(value, ['Param A', 'Param B'])
      }
    }
  }
, 'Another call' :{
    'with an unknown method': {
      topic: function() {
        var server = new Server({ port: 9996, path: '/'}, false)

        server.on('NotFound', this.callback)
        setTimeout(function () {
          var options = { host: 'localhost', port: 9996, path: '/' }
          var client = new Client(options, false)
          client.methodCall('testMethod', null, function() { })
        }, 500)
      }
    , 'return 404' : function (method, params) {
        assert.equal(method, 'testMethod')
        assert.deepEqual(params, [])
      }
    }
  }
, 'close()': {
  topic: function() {
    console.log()
    var that = this
    var server = new Server({ port: 9995, path: '/'}, false, function() {
      server.close(function() {
        var server2 = new Server({ port: 9995, path: '/'}, false, that.callback)
      })
    })
  }
  , 'allows new connections on same port':  function (error) {
      assert.ifError(error)
    }
  }
}).export(module)
