var vows   = require('vows')
  , assert = require('assert')
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
  }
}).export(module)

