var vows       = require('vows')
  , path       = require('path')
  , fs         = require('fs')
  , assert     = require('assert')
  , Serializer = require('../lib/serializer')


vows.describe('deserialize').addBatch({

  'serializeMethodCall() called with': {

    'type': {

      'BOOLEAN' : {
        'with a true Boolean param' : {
          topic: function () {
            return Serializer.serializeMethodCall('testMethod', [true])
          }
        , 'contains the value 1': assertXml('good_food/boolean_true_call.xml')
        }

      }
    }
  }
}).export(module)


//==============================================================================
// Utilities
//==============================================================================

function assertXml(fileName) {
  return function(result) {
    var file = path.join(__dirname, 'fixtures', fileName)
    var xml = fs.readFileSync(file, 'utf8').trim()
    assert.strictEqual(result, xml)
  }
}

