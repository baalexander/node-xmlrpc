var vows   = require('vows')
  , path = require('path')
  , fs = require('fs')
  , assert = require('assert')
  , unmarshallResponse = require('../lib/unmarshall').unmarshallResponse

  , error_gallery = process.env.XMLRPC_ERROR_GALLERY


vows.describe('unmarshall').addBatch(
{ 'unmarshalling broken xml':
  { topic: unmarshallResponseFixture('bad_food/broken_xml.xml')
  , 'returns an error': assertError
  }
, 'unmarshalling unknown tags':
  { topic: unmarshallResponseFixture('bad_food/unknown_tags.xml')
  , 'returns an error': assertError
  }
, 'unmarshalling a bare sequence of params':
  { topic: unmarshallResponseFixture('bad_food/just_params.xml')
  , 'returns an error': assertError
  }
}).export(module)

//==============================================================================
// Macros & Utilities
//==============================================================================

function fixtureStream(f) {
  return fs.createReadStream(path.join(__dirname, 'fixtures', f))
}

function unmarshallResponseFixture(f) {
  return function() {
    unmarshallResponse(fixtureStream(f), this.callback);
  }
}

function assertError(error, result) {
  assert.instanceOf(error, Error)
  assert.isUndefined(result)
  if (error_gallery) {
    console.log(error)
  }
}

