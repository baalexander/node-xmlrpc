var vows   = require('vows')
  , path = require('path')
  , fs = require('fs')
  , assert = require('assert')
  , unmarshallResponse = require('../lib/unmarshall').unmarshallResponse

  , error_gallery = process.env.XMLRPC_ERROR_GALLERY


vows.describe('unmarshall').addBatch(
{ 'unmarshallResponse() called with':
  { 'bad input containing':
    { 'broken xml':
      { topic: unmarshallResponseFixture('bad_food/broken_xml.xml')
      , 'results in an error': assertError
      }
    , 'non-xmlrpc xml tags':
      { topic: unmarshallResponseFixture('bad_food/unknown_tags.xml')
      , 'results in an error': assertError
      }
    , 'a bare sequence of params':
      { topic: unmarshallResponseFixture('bad_food/just_params.xml')
      , 'results in an error': assertError
      }
    }
  , 'type':
    { 'BOOLEAN':
      { 'set to a true value':
        { topic: unmarshallResponseFixture('good_food/boolean_true_response.xml')
        , 'does not return an error': assertOk
        , 'results in a true value': assertResponse(true)
        }
      , 'set to a false value':
        { topic: unmarshallResponseFixture('good_food/boolean_false_response.xml')
        , 'does not return an error': assertOk
        , 'results in a false value': assertResponse(false)
        }
      , 'containing an illegal value':
        { topic: unmarshallResponseFixture('bad_food/illegal_boolean_response.xml')
        , 'results in an error': assertError
        }
      }

    , 'DATETIME':
      { 'set to valid ISO8601 date':
        { topic: unmarshallResponseFixture('good_food/datetime_response.xml')
        , 'does not return an error': assertOk
        , 'results in a matching Date object': assertResponse(new Date(2012, 5, 8, 11, 35, 10))
        }
      , 'containing an illegal value':
        { topic: unmarshallResponseFixture('bad_food/illegal_datetime_response.xml')
        , 'results in an error': assertError
        }
      }

    , 'BASE64':
      { topic: unmarshallResponseFixture('good_food/base64_response.xml')
      , 'does not return an error': assertOk
      , 'results in the correct buffer': assertResponse(new Buffer('dGVzdGluZw==', 'base64'))
      }
      /* No illegal base64 test. node just skips illegal chars, which is RFC conform. */

    , 'DOUBLE':
      { 'set to ~\u03c0':
        { topic: unmarshallResponseFixture('good_food/double_pos_response.xml')
        , 'does not return an error': assertOk
        , 'results in the correct number': assertResponse(3.141592654)
        }
      , 'set to -\u221a2':
        { topic: unmarshallResponseFixture('good_food/double_neg_response.xml')
        , 'does not return an error': assertOk
        , 'results in the correct number': assertResponse(-1.41421)
        }
      , 'set to an illegal value':
        { topic: unmarshallResponseFixture('bad_food/illegal_double_response.xml')
        , 'results in an error': assertError
        }
      }

    , 'INT':
      { 'set to a positive value':
        { topic: unmarshallResponseFixture('good_food/int_pos_response.xml')
        , 'does not return an error': assertOk
        , 'results in the correct number': assertResponse(4)
        }
      , 'set to a negative value':
        { topic: unmarshallResponseFixture('good_food/int_neg_response.xml')
        , 'does not return an error': assertOk
        , 'results in the correct number': assertResponse(-4)
        }
      , 'set to zero':
        { topic: unmarshallResponseFixture('good_food/int_zero_response.xml')
        , 'does not return an error': assertOk
        , 'results in the correct number': assertResponse(0)
        }
      , 'set to an illegal value':
        { topic: unmarshallResponseFixture('bad_food/illegal_int_response.xml')
        , 'results in an error': assertError
        }
      }

    , 'I4':
      { 'set to a positive value':
        { topic: unmarshallResponseFixture('good_food/i4_pos_response.xml')
        , 'does not return an error': assertOk
        , 'results in the correct number': assertResponse(4)
        }
      , 'set to a negative value':
        { topic: unmarshallResponseFixture('good_food/i4_neg_response.xml')
        , 'does not return an error': assertOk
        , 'results in the correct number': assertResponse(-4)
        }
      , 'set to zero':
        { topic: unmarshallResponseFixture('good_food/i4_zero_response.xml')
        , 'does not return an error': assertOk
        , 'results in the correct number': assertResponse(0)
        }
      , 'set to an illegal value':
        { topic: unmarshallResponseFixture('bad_food/illegal_i4_response.xml')
        , 'results in an error': assertError
        }
      }

    , 'I8':
      { 'set to a positive value':
        { topic: unmarshallResponseFixture('good_food/i8_pos_response.xml')
        , 'does not return an error': assertOk
        , 'results in the correct string': assertResponse('4611686018427387904')
        }
      , 'set to a negative value':
        { topic: unmarshallResponseFixture('good_food/i8_neg_response.xml')
        , 'does not return an error': assertOk
        , 'results in the correct string': assertResponse('-4611686018427387904')
        }
      , 'set to zero':
        { topic: unmarshallResponseFixture('good_food/i8_zero_response.xml')
        , 'does not return an error': assertOk
        , 'results in the correct string': assertResponse('0')
        }
      , 'set to an illegal value':
        { topic: unmarshallResponseFixture('bad_food/illegal_i8_response.xml')
        , 'results in an error': assertError
        }
      }

    , 'STRING':
      { 'containing characters':
        { topic: unmarshallResponseFixture('good_food/string_response.xml')
        , 'does not return an error': assertOk
        , 'results in the right string': assertResponse('testString')
        }
      , 'without content':
        { topic: unmarshallResponseFixture('good_food/string_empty_response.xml')
        , 'does not return an error': assertOk
        , 'results in an empty string': assertResponse('')
        }
        /* invalid string, anyone? */
      }
    }

  , 'a param of unspecified type':
    { topic: unmarshallResponseFixture('good_food/unspecified_type_response.xml')
    , 'does not return an error': assertOk
    , 'results in a string': assertResponse('testString')
    }

  , 'compound':
    { 'ARRAY':
      { 'containing simple values':
        { topic: unmarshallResponseFixture('good_food/array_simple_response.xml')
        , 'does not return an error': assertOk
        , 'results in the correct array': assertResponse([178, 'testString'])
        }
      , 'containing no values':
        { topic: unmarshallResponseFixture('good_food/array_empty_response.xml')
        , 'does not return an error': assertOk
        , 'results in an empty array': assertResponse([])
        }
      , 'that has one nested ARRAY':
        { topic: unmarshallResponseFixture('good_food/array_nested_response.xml')
        , 'does not return an error': assertOk
        , 'results in an array containing another array':
              assertResponse([178, 'testLevel1String', ['testString', 64]])
        }
      , 'that has a nested ARRAY followed by more simple values':
        { topic: unmarshallResponseFixture('good_food/array_nested_with_trailing_values_response.xml')
        , 'does not return an error': assertOk
        , 'results in an array containing another array and the trailing values':
              assertResponse([178, 'testLevel1String', ['testString', 64], 'testLevel1StringAfter'])
        }
      }
    , 'STRUCT':
      { 'containing simple values':
        { topic: unmarshallResponseFixture('good_food/struct_simple_response.xml')
        , 'does not return an error': assertOk
        , 'results in a matching object': assertResponse({'the-Name': 'testValue'})
        }
      , 'containing an implicit string':
        { topic: unmarshallResponseFixture('good_food/struct_implicit_string_response.xml')
        , 'does not return an error': assertOk
        , 'results in a matching object': assertResponse({'the-Name': 'testValue'})
        }
      , 'that has whitespace after the name element':
        { topic: unmarshallResponseFixture('good_food/struct_with_whitespace_response.xml')
        , 'does not return an error': assertOk
        , 'results in a matching object': assertResponse({'the-Name': 'testValue'})
        }
      , 'containing another STRUCT':
        { topic: unmarshallResponseFixture('good_food/struct_nested_response.xml')
        , 'does not return an error': assertOk
        , 'results in a matching object':
            assertResponse( { theName: 'testValue'
                            , anotherName: { nestedName: 'nestedValue' }
                            , lastName: 'Smith'
                            })
        }
      }
    , 'FAULT':
      { 'which includes error information':
        { topic: unmarshallResponseFixture('good_food/fault.xml')
        , 'results in an error': assertError
        , 'which has all properties of a proper xmlrpc fault': function(error, r) {
            assert.strictEqual(error.message, 'xmlrpc fault: Too many parameters.')
            assert.strictEqual(error.faultString, 'Too many parameters.')
            assert.strictEqual(error.faultCode, 4)
          }
        }
      , 'which does not include error information':
        { topic: unmarshallResponseFixture('good_food/fault_empty.xml')
        , 'results in an error': assertError
        }
      , 'that contains an empty string':
        { topic: unmarshallResponseFixture('good_food/fault_explicit_empty.xml')
        , 'results in an error': assertError
        }
      }
    , 'a mix of everything':
      { topic: unmarshallResponseFixture('good_food/grinder.xml')
        , 'does not return an error': assertOk
        , 'results in a matching object':
            assertResponse( [ { theName: 'testValue'
                              , anotherName: {nestedName: 'nestedValue' }
                              , lastName: 'Smith' 
                              }
                            , [ { yetAnotherName: 1999.26} , 'moreNested' ]
                            ])
      }
    }
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
    console.log('' + error)
  }
}

function assertOk(error, result) {
  assert.isTrue( ! error)
}

function assertResponse(what) {
  return function(error, result) {
    assert.deepEqual(result, what)
  }
}

