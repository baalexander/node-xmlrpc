var vows         = require('vows')
  , assert       = require('assert')
  , xmlrpcParser = require('../lib/xmlrpc-parser.js')

vows.describe('XML-RPC Parser').addBatch({
  //////////////////////////////////////////////////////////////////////
  // Test parseResponseXml functionality
  //////////////////////////////////////////////////////////////////////
  'A parseResponseXml call' : {
    // Test Array
    'with an Array param' : {
      topic: function() {
        var xml = '<methodResponse><params>'
          + '<param><value><array><data><value><int>178</int></value><value><string>testString</string></value></data></array></value></param>'
          + '</params></methodResponse>'
        xmlrpcParser.parseResponseXml(xml, this.callback)
      }
    , 'contains an array of arrays' : function (err, value) {
        assert.isArray(value, 'array')
        assert.deepEqual(value, [178, 'testString'])
      }
    }
  , 'with a nested Array param' : {
      topic: function() {
        var xml = '<methodResponse><params>'
          + '<param><value><array><data><value><int>178</int></value><value><string>testLevel1String</string></value><value><array><data><value><string>testString</string></value><value><int>64</int></value></data></array></value></data></array></value></param>'
          + '</params></methodResponse>'
        xmlrpcParser.parseResponseXml(xml, this.callback)
      }
    , 'contains an array of arrays' : function (err, value) {
        assert.isArray(value, 'array')
        assert.deepEqual(value, [178, 'testLevel1String', ['testString', 64]])
      }
    }
  , 'with a nested Array param and values after the nested array' : {
      topic: function() {
        var xml = '<methodResponse><params>'
          + '<param><value><array><data><value><int>178</int></value><value><string>testLevel1String</string></value><value><array><data><value><string>testString</string></value><value><int>64</int></value></data></array></value><value><string>testLevel1StringAfter</string></value></data></array></value></param>'
          + '</params></methodResponse>'
        xmlrpcParser.parseResponseXml(xml, this.callback)
      }
    , 'contains an array of arrays' : function (err, value) {
        assert.isArray(value, 'array')
        assert.deepEqual(value, [178, 'testLevel1String', ['testString', 64], 'testLevel1StringAfter'])
      }
    }
    // Test Boolean
  , 'with a true Boolean param' : {
      topic: function() {
        var xml = '<methodResponse><params>'
          + '<param><value><boolean>1</boolean></value></param>'
          + '</params></methodResponse>'
        xmlrpcParser.parseResponseXml(xml, this.callback)
      }
    , 'contains an array with a true value' : function (err, value) {
        assert.typeOf(value, 'boolean')
        assert.strictEqual(value, true)
      }
    }
  , 'with a false Boolean param' : {
      topic: function() {
        var xml = '<methodResponse><params>'
          + '<param><value><boolean>0</boolean></value></param>'
          + '</params></methodResponse>'
        xmlrpcParser.parseResponseXml(xml, this.callback)
      }
    , 'contains an array with a false value' : function (err, value) {
        assert.typeOf(value, 'boolean')
        assert.strictEqual(value, false)
      }
    }
    // Test DateTime
  , 'with a Datetime param' : {
      topic: function() {
        var xml = '<methodResponse><params>'
          + '<param><value><dateTime.iso8601>20120608T11:35:10</dateTime.iso8601></value></param>'
          + '</params></methodResponse>'
        xmlrpcParser.parseResponseXml(xml, this.callback)
      }
    , 'contains the Date object' : function (err, value) {
        assert.typeOf(value, 'date')
        assert.deepEqual(value, new Date(2012, 05, 08, 11, 35, 10))
      }
    }
    // Test Double
  , 'with a positive Double param' : {
      topic: function() {
        var xml = '<methodResponse><params>'
          + '<param><value><double>4.11</double></value></param>'
          + '</params></methodResponse>'
        xmlrpcParser.parseResponseXml(xml, this.callback)
      }
    , 'contains the positive double' : function (err, value) {
        assert.isNumber(value)
        assert.strictEqual(value, 4.11)
      }
    }
  , 'with a negative Double param' : {
      topic: function() {
        var xml = '<methodResponse><params>'
          + '<param><value><double>-4.2221</double></value></param>'
          + '</params></methodResponse>'
        xmlrpcParser.parseResponseXml(xml, this.callback)
      }
    , 'contains the positive double' : function (err, value) {
        assert.isNumber(value)
        assert.strictEqual(value, -4.2221)
      }
    }
    // Test Integer
  , 'with a positive Int param' : {
      topic: function() {
        var xml = '<methodResponse><params>'
          + '<param><value><int>4</int></value></param>'
          + '</params></methodResponse>'
        xmlrpcParser.parseResponseXml(xml, this.callback)
      }
    , 'contains the positive integer' : function (err, value) {
        assert.isNumber(value)
        assert.strictEqual(value, 4)
      }
    }
  , 'with a positive I4 param' : {
      topic: function() {
        var xml = '<methodResponse><params>'
          + '<param><value><i4>6</i4></value></param>'
          + '</params></methodResponse>'
        xmlrpcParser.parseResponseXml(xml, this.callback)
      }
    , 'contains the positive integer' : function (err, value) {
        assert.isNumber(value)
        assert.strictEqual(value, 6)
      }
    }
  , 'with a negative Int param' : {
      topic: function() {
        var xml = '<methodResponse><params>'
          + '<param><value><int>-14</int></value></param>'
          + '</params></methodResponse>'
        xmlrpcParser.parseResponseXml(xml, this.callback)
      }
    , 'contains the negative integer' : function (err, value) {
        assert.isNumber(value)
        assert.strictEqual(value, -14)
      }
    }
  , 'with a negative I4 param' : {
      topic: function() {
        var xml = '<methodResponse><params>'
          + '<param><value><i4>-26</i4></value></param>'
          + '</params></methodResponse>'
        xmlrpcParser.parseResponseXml(xml, this.callback)
      }
    , 'contains the negative integer' : function (err, value) {
        assert.isNumber(value)
        assert.strictEqual(value, -26)
      }
    }
  , 'with a Int param of 0' : {
      topic: function() {
        var xml = '<methodResponse><params>'
          + '<param><value><int>0</int></value></param>'
          + '</params></methodResponse>'
        xmlrpcParser.parseResponseXml(xml, this.callback)
      }
    , 'contains the value 0' : function (err, value) {
        assert.isNumber(value)
        assert.strictEqual(value, 0)
      }
    }
  , 'with a I4 param of 0' : {
      topic: function() {
        var xml = '<methodResponse><params>'
          + '<param><value><i4>0</i4></value></param>'
          + '</params></methodResponse>'
        xmlrpcParser.parseResponseXml(xml, this.callback)
      }
    , 'contains the value 0' : function (err, value) {
        assert.isNumber(value)
        assert.deepEqual(value, 0)
      }
    }
    // Test String
  , 'with a String param' : {
      topic: function() {
        var xml = '<methodResponse><params>'
          + '<param><value><string>testString</string></value></param>'
          + '</params></methodResponse>'
        xmlrpcParser.parseResponseXml(xml, this.callback)
      }
    , 'contains an array with the string' : function (err, value) {
        assert.isString(value)
        assert.strictEqual(value, 'testString')
      }
    }
    // Test Struct
  , 'with a Struct param' : {
      topic: function() {
        var xml = '<methodResponse><params>'
          + '<param><value><struct><member><name>theName</name><value><string>testValue</string></value></member></struct></value></param>'
          + '</params></methodResponse>'
        xmlrpcParser.parseResponseXml(xml, this.callback)
      }
    , 'contains the object' : function (err, value) {
        assert.isObject(value)
        assert.deepEqual(value, { theName: 'testValue'})
      }
    }
  , 'with a nested Struct param' : {
      topic: function() {
        var xml = '<methodResponse><params>'
          + '<param><value><struct><member><name>theName</name><value><string>testValue</string></value></member><member><name>anotherName</name><value><struct><member><name>nestedName</name><value><string>nestedValue</string></value></member></struct></value></member><member><name>lastName</name><value><string>Smith</string></value></member></struct></value></param>'
          + '</params></methodResponse>'
        xmlrpcParser.parseResponseXml(xml, this.callback)
      }
    , 'contains the objects' : function (err, value) {
        assert.isObject(value)
        assert.deepEqual(value, { theName: 'testValue', anotherName: {nestedName: 'nestedValue' }, lastName: 'Smith'})
      }
    }
  // The grinder
  , 'with a mix of everything' : {
      topic: function() {
        var xml = '<methodResponse><params>'
          + '<param><value><array><data>'
            + '<value><struct><member><name>theName</name><value><string>testValue</string></value></member><member><name>anotherName</name><value><struct><member><name>nestedName</name><value><string>nestedValue</string></value></member></struct></value></member><member><name>lastName</name><value><string>Smith</string></value></member></struct></value>'
            + '<value><array><data>'
              + '<value><struct><member><name>yetAnotherName</name><value><double>1999.26</double></value></member></struct></value>'
              + '<value><string>moreNested</string></value>'
            + '</data></array></value>'
          + '</data></array></value></param>'
          + '</params></methodResponse>'
        xmlrpcParser.parseResponseXml(xml, this.callback)
      }
    , 'contains the objects' : function (err, value) {
        assert.isArray(value)
          var expected = [
            { theName: 'testValue', anotherName: {nestedName: 'nestedValue' }, lastName: 'Smith' }
          , [
              { yetAnotherName: 1999.26}
            , 'moreNested'
            ]
          ]
        assert.deepEqual(value, expected)
      }
    }
  // ROS (Robot Operating System) example
  , 'with a response that ROS would give' : {
      topic: function() {
        var xml = '<?xml version=\'1.0\'?><methodResponse><params><param><value><array><data><value><int>1</int></value><value><string>current system state</string></value><value><array><data><value><array><data><value><array><data><value><string>/rosout_agg</string></value><value><array><data><value><string>/rosout</string></value></data></array></value></data></array></value></data></array></value><value><array><data><value><array><data><value><string>/rosout</string></value><value><array><data><value><string>/rosout</string></value></data></array></value></data></array></value></data></array></value><value><array><data><value><array><data><value><string>/rosout/set_logger_level</string></value><value><array><data><value><string>/rosout</string></value></data></array></value></data></array></value><value><array><data><value><string>/rosout/get_loggers</string></value><value><array><data><value><string>/rosout</string></value></data></array></value></data></array></value></data></array></value></data></array></value></data></array></value></param></params></methodResponse>'
        xmlrpcParser.parseResponseXml(xml, this.callback)
      }
    , 'contains the objects' : function (err, value) {
        assert.isArray(value)
        var expected = [1, 'current system state', [[['/rosout_agg', ['/rosout']]], [['/rosout', ['/rosout']]], [['/rosout/set_logger_level', ['/rosout']], ['/rosout/get_loggers', ['/rosout']]]]]
        assert.deepEqual(value, expected)
      }
    }
  , 'with a response that ROS would give (includes new lines)' : {
      topic: function() {
        var xml = ['<?xml version=\'1.0\'?>'
          , '<methodResponse>'
          , '<params>'
          , '<param>'
          , '<value><array><data>'
          , '<value><int>1</int></value>'
          , '<value><string>current system state</string></value>'
          , '<value><array><data>'
          , '<value><array><data>'
          , '<value><array><data>'
          , '<value><string>/rosout_agg</string></value>'
          , '<value><array><data>'
          , '<value><string>/rosout</string></value>'
          , '</data></array></value>'
          , '</data></array></value>'
          , '</data></array></value>'
          , '<value><array><data>'
          , '<value><array><data>'
          , '<value><string>/rosout</string></value>'
          , '<value><array><data>'
          , '<value><string>/rosout</string></value>'
          , '</data></array></value>'
          , '</data></array></value>'
          , '</data></array></value>'
          , '<value><array><data>'
          , '<value><array><data>'
          , '<value><string>/rosout/set_logger_level</string></value>'
          , '<value><array><data>'
          , '<value><string>/rosout</string></value>'
          , '</data></array></value>'
          , '</data></array></value>'
          , '<value><array><data>'
          , '<value><string>/rosout/get_loggers</string></value>'
          , '<value><array><data>'
          , '<value><string>/rosout</string></value>'
          , '</data></array></value>'
          , '</data></array></value>'
          , '</data></array></value>'
          , '</data></array></value>'
          , '</data></array></value>'
          , '</param>'
          , '</params>'
          , '</methodResponse>'
          ].join('\n')
        xmlrpcParser.parseResponseXml(xml, this.callback)
      }
    , 'contains the objects' : function (err, value) {
        assert.isArray(value)
        var expected = [1, 'current system state', [[['/rosout_agg', ['/rosout']]], [['/rosout', ['/rosout']]], [['/rosout/set_logger_level', ['/rosout']], ['/rosout/get_loggers', ['/rosout']]]]]
        assert.deepEqual(value, expected)
      }
    }
  }

  //////////////////////////////////////////////////////////////////////
  // Test parseMethodCall functionality
  //////////////////////////////////////////////////////////////////////
, 'A parseMethodCall call' : {
    // Test String
    'with a String param' : {
      topic: function() {
        var xml = '<methodCall><methodName>testMethod</methodName><params>'
          + '<param><value><string>testString</string></value></param>'
          + '</params></methodCall>'
        xmlrpcParser.parseMethodCall(xml, this.callback)
      }
    , 'contains method name and the String' : function (err, method, params) {
        assert.isString(method)
        assert.strictEqual(method, 'testMethod')
        assert.isArray(params)
        assert.deepEqual(params, ['testString'])
      }
    }
  }

}).export(module)
