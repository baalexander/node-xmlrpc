var vows   = require('vows')
  , assert = require('assert')
  , http   = require('http')
  , fs     = require('fs')
  , Client = require('../lib/client')

vows.describe('Client').addBatch({
  //////////////////////////////////////////////////////////////////////
  // Test Constructor functionality
  //////////////////////////////////////////////////////////////////////
  'A constructor' : {
    // Test standard Client initialization
    'with URI options only' : {
      topic: function () {
        var client = new Client({ host: 'localhost', port: 9999, path: '/'}, false)
        return client.options
      }
    , 'contains the standard headers' : function (topic) {
        assert.deepEqual(topic, { host: 'localhost', port: 9999, path: '/', method: 'POST', headers: { 'User-Agent': 'NodeJS XML-RPC Client', 'Content-Type': 'text/xml', 'Accept': 'text/xml', 'Accept-Charset' : 'UTF8'}})
      }
    }
    // Test passing custom headers to the Client
  , 'with options containing header params' : {
      topic: function () {
        var client = new Client({ host: 'localhost', port: 9999, path: '/', headers: { 'User-Agent': 'Testaroo', 'Authorization': 'Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==' }}, false)
        return client.options
      }
    , 'does not overwrite the custom headers' : function (topic) {
        assert.deepEqual(topic, { host: 'localhost', port: 9999, path: '/', method: 'POST', headers: { 'User-Agent': 'Testaroo', 'Authorization': 'Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==', 'Content-Type': 'text/xml', 'Accept': 'text/xml', 'Accept-Charset' : 'UTF8'}})
      }
    }
  }
  //////////////////////////////////////////////////////////////////////
  // Test method call functionality
  //////////////////////////////////////////////////////////////////////
, 'A method call' : {
    // Test invalid internal URI to send method call to
    'with an invalid internal URI' : {
      topic: function () {
        var client = new Client({ host: 'localhost', port: 9999, path: '/'}, false)
        client.methodCall('getArray', null, this.callback)
      }
    , 'contains the error' : function (error, value) {
        assert.isObject(error)
      }
    }
    // Test long method response, which requires multiple chunks returned from
    // the http request
  , 'with a very long response' : {
      topic: function () {
        var that = this
        // Basic http server that sends a long XML response (stored in file to
        // avoid cluttering up the test cases)
        http.createServer(function (request, result) {
          fs.readFile(__dirname + '/listMethods.xml', function (error, data) {
            result.writeHead(200, {'Content-Type': 'text/xml'})
            var xml = data + ''
            var part1 = xml.substring(0, xml.length / 2 + 5)
            result.write(part1)
            var part2 = xml.substring(xml.length / 2 + 5, xml.length)
            result.write(part2)
            result.end()
          });
        }).listen(9090, 'localhost');
        // Waits briefly to give the server time to start up and start listening
        setTimeout(function () {
          var client = new Client({ host: 'localhost', port: 9090, path: '/'}, false)
          client.methodCall('listMethods', null, that.callback)
        }, 500)
      }
    , 'contains the array' : function (error, value) {
        // Reads in the expected response as JSON and compares
        var data = fs.readFileSync(__dirname + '/listMethods.json')
        assert.deepEqual(value, JSON.parse(data))
      }
    }
  }
}).export(module)