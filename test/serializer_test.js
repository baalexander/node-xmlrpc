var vows       = require('vows')
  , path       = require('path')
  , fs         = require('fs')
  , assert     = require('assert')
  , Serializer = require('../lib/serializer')
  , CustomType = require('../lib/customtype')
  , util = require('util')

vows.describe('Serializer').addBatch({

  'serializeMethodCall() called with': {

    'type': {

      'boolean' : {
        'with a true boolean param' : {
          topic: function () {
            var value = true
            return Serializer.serializeMethodCall('testMethod', [value])
          }
        , 'contains the value 1': assertXml('good_food/boolean_true_call.xml')
        }
      , 'with a false boolean param' : {
          topic: function () {
            var value = false
            return Serializer.serializeMethodCall('testMethod', [value])
          }
        , 'contains the value 0': assertXml('good_food/boolean_false_call.xml')
        }
      }

    , 'datetime' : {
        'with a regular datetime param' : {
          topic: function () {
            var value = new Date(2012, 05, 07, 11, 35, 10)
            return Serializer.serializeMethodCall('testMethod', [value])
          }
        , 'contains the timestamp': assertXml('good_food/datetime_call.xml')
        }
      }

    , 'base64' : {
        'with a base64 param' : {
          topic: function () {
            var value = new Buffer('dGVzdGluZw==', 'base64')
            return Serializer.serializeMethodCall('testMethod', [value])
          }
        , 'contains the base64 string': assertXml('good_food/base64_call.xml')
        }
      }

    , 'double' : {
        'with a positive double param' : {
          topic: function () {
            var value = 17.5
            return Serializer.serializeMethodCall('testMethod', [value])
          }
        , 'contains the positive double': assertXml('good_food/double_positive_call.xml')
        }
      , 'with a negative double param' : {
          topic: function () {
            var value = -32.7777
            return Serializer.serializeMethodCall('testMethod', [value])
          }
        , 'contains the negative double': assertXml('good_food/double_negative_call.xml')
        }
      }

    , 'integer' : {
        'with a positive integer param' : {
          topic: function () {
            var value = 17
            return Serializer.serializeMethodCall('testMethod', [value])
          }
        , 'contains the positive integer': assertXml('good_food/int_positive_call.xml')
        }
      , 'with a negative integer param' : {
          topic: function () {
            var value = -32
            return Serializer.serializeMethodCall('testMethod', [value])
          }
        , 'contains the negative integer': assertXml('good_food/int_negative_call.xml')
        }
      , 'with an integer param of 0' : {
          topic: function () {
            var value = 0
            return Serializer.serializeMethodCall('testMethod', [value])
          }
        , 'contains 0': assertXml('good_food/int_zero_call.xml')
        }
      }

    , 'nil' : {
        'with a null param' : {
          topic: function () {
            var value = null
            return Serializer.serializeMethodCall('testMethod', [value])
          }
        , 'contains the nil': assertXml('good_food/nil_call.xml')
        }
      }

    , 'string' : {
        'with a regular string param' : {
          topic: function () {
            var value = 'testString'
            return Serializer.serializeMethodCall('testMethod', [value])
          }
        , 'contains the string': assertXml('good_food/string_call.xml')
        }
      , 'with a string param that requires CDATA' : {
          topic: function () {
            var value = '<html><body>Congrats</body></html>'
            return Serializer.serializeMethodCall('testCDATAMethod', [value])
          }
        , 'contains the CDATA-wrapped string': assertXml('good_food/string_cdata_call.xml')
        }
      , 'with a multiline string param that requires CDATA' : {
          topic: function () {
            var value = '<html>\n<head><title>Go testing!</title></head>\n<body>Congrats</body>\n</html>'
            return Serializer.serializeMethodCall('testCDATAMethod', [value])
          }
        , 'contains the CDATA-wrapped string': assertXml('good_food/string_multiline_cdata_call.xml')
        }
      , 'with an empty string' : {
          topic: function () {
            var value = ''
            return Serializer.serializeMethodCall('testMethod', [value])
          }
        , 'contains the empty string': assertXml('good_food/string_empty_call.xml')
        }
      , 'with a string contains emoji': {
          topic: function () {
              var value = new Buffer('f09f9881', 'hex').toString('utf-8')
              return Serializer.serializeMethodCall('testMethod', [value])
          }
        , 'contains a smiley' : assertXml('good_food/string_emoji.xml')
        }
      }

    , 'undefined' : {
        'with an undefined param' : {
          topic: function () {
            var value = undefined
            return Serializer.serializeMethodCall('testMethod', [value])
          }
        , 'contains the empty value': assertXml('good_food/undefined_call.xml')
        }
      }

    }

  , 'compound': {

      'array' : {
        'with a simple array' : {
          topic: function () {
            var value = ['string1', 3]
            return Serializer.serializeMethodCall('testMethod', [value])
          }
        , 'contains the array': assertXml('good_food/array_call.xml')
        }
      }

    , 'struct' : {
        'with a one-level struct' : {
          topic: function () {
            var value = {
              stringName: 'string1'
            , intName: 3
            }
            return Serializer.serializeMethodCall('testMethod', [value])
          }
        , 'contains the struct': assertXml('good_food/struct_call.xml')
        }
      , 'with a one-level struct and an empty property name' : {
          topic: function () {
            var value = {
              stringName: ''
            , intName: 3
            }
            return Serializer.serializeMethodCall('testMethod', [value])
          }
        , 'contains the struct': assertXml('good_food/struct_empty_property_call.xml')
        }
      , 'with a two-level struct' : {
          topic: function () {
            var value = {
              stringName: 'string1'
            , objectName: {
                intName: 4
              }
            }
            return Serializer.serializeMethodCall('testMethod', [value])
          }
        , 'contains the struct': assertXml('good_food/struct_nested_call.xml')
        }
      }

    }
  , 'CustomType': {
        'default' : {
            topic: function () {
              var value = new CustomType('testCustomType')
              return Serializer.serializeMethodCall('testMethod', [value])
            }
          , 'contains the customType': assertXml('good_food/customtype_call.xml')
        }
      , 'extended' : {
          topic: function () {
            var ExtendedCustomType = function (raw) {
              raw = 'extended' + raw
              CustomType.call(this, raw)
            }
            util.inherits(ExtendedCustomType, CustomType)
            ExtendedCustomType.prototype.tagName = 'extendedCustomType'
            var value = new ExtendedCustomType('TestCustomType')
            return Serializer.serializeMethodCall('testMethod', [value])
          }
        , 'contains the customType': assertXml('good_food/customtype_extended_call.xml')
      }
    }
  , 'utf-8 encoding': {
      topic: function () {
        var value = "\x46\x6F\x6F"
        return Serializer.serializeMethodCall('testMethod', [value], 'utf-8')
      }
    , 'contains the encoding attribute': assertXml('good_food/encoded_call.xml')
    }
  }

, 'serializeMethodResponse() called with': {

    'type': {

      'boolean' : {
        'with a true boolean param' : {
          topic: function () {
            var value = true
            return Serializer.serializeMethodResponse(value)
          }
        , 'contains the value 1': assertXml('good_food/boolean_true_response.xml')
        }
      , 'with a false boolean param' : {
          topic: function () {
            var value = false
            return Serializer.serializeMethodResponse(value)
          }
        , 'contains the value 0': assertXml('good_food/boolean_false_response.xml')
        }
      }

    , 'datetime' : {
        'with a regular datetime param' : {
          topic: function () {
            var value = new Date(2012, 5, 8, 11, 35, 10)
            return Serializer.serializeMethodResponse(value)
          }
        , 'contains the timestamp': assertXml('good_food/datetime_response.xml')
        }
      }

    , 'base64' : {
        'with a base64 param' : {
          topic: function () {
            var value = new Buffer('dGVzdGluZw==', 'base64')
            return Serializer.serializeMethodResponse(value)
          }
        , 'contains the base64 string': assertXml('good_food/base64_response.xml')
        }
      }

    , 'double' : {
        'with a positive double param' : {
          topic: function () {
            var value = 3.141592654
            return Serializer.serializeMethodResponse(value)
          }
        , 'contains the positive double': assertXml('good_food/double_positive_response.xml')
        }
      , 'with a negative double param' : {
          topic: function () {
            var value = -1.41421
            return Serializer.serializeMethodResponse(value)
          }
        , 'contains the negative double': assertXml('good_food/double_negative_response.xml')
        }
      }

    , 'integer' : {
        'with a positive integer param' : {
          topic: function () {
            var value = 4
            return Serializer.serializeMethodResponse(value)
          }
        , 'contains the positive integer': assertXml('good_food/int_positive_response.xml')
        }
      , 'with a negative integer param' : {
          topic: function () {
            var value = -4
            return Serializer.serializeMethodResponse(value)
          }
        , 'contains the negative integer': assertXml('good_food/int_negative_response.xml')
        }
      , 'with an integer param of 0' : {
          topic: function () {
            var value = 0
            return Serializer.serializeMethodResponse(value)
          }
        , 'contains 0': assertXml('good_food/int_zero_response.xml')
        }
      }

    , 'string' : {
        'with a regular string param' : {
          topic: function () {
            var value = 'testString'
            return Serializer.serializeMethodResponse(value)
          }
        , 'contains the string': assertXml('good_food/string_response.xml')
        }
      , 'with an empty string' : {
          topic: function () {
            var value = ''
            return Serializer.serializeMethodResponse(value)
          }
        , 'contains the empty string': assertXml('good_food/string_empty_response.xml')
        }
      , 'with string contains emoji' : {
          topic: function () {
            var value = new Buffer('f09f9881', 'hex').toString('utf-8')
            return Serializer.serializeMethodResponse(value)
          }
        , 'contains emoji': assertXml('good_food/string_emoji_response.xml')
        }
      }

    , 'undefined' : {
        'with an undefined param' : {
          topic: function () {
            var value = undefined
            return Serializer.serializeMethodResponse(value)
          }
        , 'contains the empty value': assertXml('good_food/undefined_response.xml')
        }
      }

    }

  , 'compound': {

      'array' : {
        'with a simple array' : {
          topic: function () {
            var value = [178, 'testString']
            return Serializer.serializeMethodResponse(value)
          }
        , 'contains the array': assertXml('good_food/array_response.xml')
        }
      }

    , 'struct' : {
        'with a one-level struct' : {
          topic: function () {
            var value = {
              'the-Name': 'testValue'
            }
            return Serializer.serializeMethodResponse(value)
          }
        , 'contains the struct': assertXml('good_food/struct_response.xml')
        }
      , 'with a two-level struct' : {
          topic: function () {
            var value = {
              theName: 'testValue'
            , anotherName: {
                nestedName: 'nestedValue'
              }
            , lastName: 'Smith'
            }
            return Serializer.serializeMethodResponse(value)
          }
        , 'contains the struct': assertXml('good_food/struct_nested_response.xml')
        }
      }

    , 'fault' : {
        'with a fault' : {
          topic: function () {
            var value = {
              faultCode: 4
            , faultString: 'Too many parameters.'
            }
            return Serializer.serializeFault(value)
          }
        , 'contains the fault': assertXml('good_food/fault.xml')
        }
      }

    }

  , 'CustomType': {
      'default' : {
          topic: function () {
            var value = new CustomType('testCustomType')
            return Serializer.serializeMethodResponse(value)
          }
        , 'contains the customType': assertXml('good_food/customtype_response.xml')
      }
    , 'extended' : {
        topic: function () {
          var ExtendedCustomType = function (raw) {
            raw = 'extended' + raw
            CustomType.call(this, raw)
          }
          util.inherits(ExtendedCustomType, CustomType)
          ExtendedCustomType.prototype.tagName = 'extendedCustomType'
          var value = new ExtendedCustomType('TestCustomType')
          return Serializer.serializeMethodResponse(value)
        }
      , 'contains the customType': assertXml('good_food/customtype_extended_response.xml')
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

