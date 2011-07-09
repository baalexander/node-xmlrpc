var vows   = require('vows')
  , assert = require('assert')
  , Client = require('../lib/client')

vows.describe('Client').addBatch({
  //////////////////////////////////////////////////////////////////////
  // Test method call functionality
  //////////////////////////////////////////////////////////////////////
  'A method call' : {
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

