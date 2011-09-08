var vows          = require('vows')
  , assert        = require('assert')
  , xmlrpcBuilder = require('../lib/xmlrpc-builder.js')

vows.describe('XML-RPC Builder').addBatch({
  //////////////////////////////////////////////////////////////////////
  // Test buildMethodCall functionality
  //////////////////////////////////////////////////////////////////////
  'A buildMethodCall call' : {
    // Test Array
    'with an Array param' : {
      topic: function () {
        xmlrpcBuilder.buildMethodCall('testMethod', [['string1', 3]], this.callback)
      }
    , 'contains the array' : function (error, xml) {
        assert.isNull(error)
        assert.equal(xml, '<?xml version="1.0"?><methodCall><methodName>testMethod</methodName><params><param><value><array><data><value><string>string1</string></value><value><int>3</int></value></data></array></value></param></params></methodCall>')
      }
    }
    // Test Boolean
  , 'with a true Boolean param' : {
      topic: function () {
        xmlrpcBuilder.buildMethodCall('testMethod', [true], this.callback)
      }
    , 'contains the value 1' : function (error, xml) {
        assert.isNull(error)
        assert.equal(xml, '<?xml version="1.0"?><methodCall><methodName>testMethod</methodName><params><param><value><boolean>1</boolean></value></param></params></methodCall>')
      }
    }
  , 'with a false Boolean param' : {
      topic: function () {
        xmlrpcBuilder.buildMethodCall('testMethod', [false], this.callback)
      }
    , 'contains the value 0' : function (error, xml) {
        assert.isNull(error)
        assert.equal(xml, '<?xml version="1.0"?><methodCall><methodName>testMethod</methodName><params><param><value><boolean>0</boolean></value></param></params></methodCall>')
      }
    }
    // Test Datetime
  , 'with a Datetime param' : {
      topic: function () {
        xmlrpcBuilder.buildMethodCall('testMethod', [new Date(2012, 05, 07, 11, 35, 10)], this.callback)
      }
    , 'contains the timestamp' : function (error, xml) {
        assert.isNull(error)
        assert.equal(xml, '<?xml version="1.0"?><methodCall><methodName>testMethod</methodName><params><param><value><dateTime.iso8601>20120607T11:35:10</dateTime.iso8601></value></param></params></methodCall>')
      }
    }
    // Test Double
  , 'with a positive Double param' : {
      topic: function () {
        xmlrpcBuilder.buildMethodCall('testMethod', [17.5], this.callback)
      }
    , 'contains the double' : function (error, xml) {
        assert.isNull(error)
        assert.equal(xml, '<?xml version="1.0"?><methodCall><methodName>testMethod</methodName><params><param><value><double>17.5</double></value></param></params></methodCall>')
      }
    }
  , 'with a negative Double param' : {
      topic: function () {
        xmlrpcBuilder.buildMethodCall('testMethod', [-32.7777], this.callback)
      }
    , 'contains the negative double' : function (error, xml) {
        assert.isNull(error)
        assert.equal(xml, '<?xml version="1.0"?><methodCall><methodName>testMethod</methodName><params><param><value><double>-32.7777</double></value></param></params></methodCall>')
      }
    }
    // Test Integer
  , 'with a positive Interger param' : {
      topic: function () {
        xmlrpcBuilder.buildMethodCall('testMethod', [17], this.callback)
      }
    , 'contains the integer' : function (error, xml) {
        assert.isNull(error)
        assert.equal(xml, '<?xml version="1.0"?><methodCall><methodName>testMethod</methodName><params><param><value><int>17</int></value></param></params></methodCall>')
      }
    }
  , 'with a negative Integer param' : {
      topic: function () {
        xmlrpcBuilder.buildMethodCall('testMethod', [-32], this.callback)
      }
    , 'contains the negative integer' : function (error, xml) {
        assert.equal(xml, '<?xml version="1.0"?><methodCall><methodName>testMethod</methodName><params><param><value><int>-32</int></value></param></params></methodCall>')
      }
    }
  , 'with an Integer param of 0' : {
      topic: function () {
        xmlrpcBuilder.buildMethodCall('testMethod', [0], this.callback)
      }
    , 'contains 0' : function (error, xml) {
        assert.isNull(error)
        assert.equal(xml, '<?xml version="1.0"?><methodCall><methodName>testMethod</methodName><params><param><value><int>0</int></value></param></params></methodCall>')
      }
    }
    // Test Nil
  , 'with a Nil param' : {
      topic: function () {
        xmlrpcBuilder.buildMethodCall('testMethod', [null], this.callback)
      }
    , 'contains the nil' : function (error, xml) {
        assert.isNull(error)
        assert.equal(xml, '<?xml version="1.0"?><methodCall><methodName>testMethod</methodName><params><param><value><nil/></value></param></params></methodCall>')
      }
    }
    // Test String
  , 'with a regular String param' : {
      topic: function() {
        xmlrpcBuilder.buildMethodCall('testMethod', ['testString'], this.callback)
      }
    , 'contains the string' : function (error, xml) {
        assert.isNull(error)
        assert.equal(xml, '<?xml version="1.0"?><methodCall><methodName>testMethod</methodName><params><param><value><string>testString</string></value></param></params></methodCall>')
      }
    }
  , 'with a String param that requires CDATA' : {
      topic: function() {
        xmlrpcBuilder.buildMethodCall('testCDATAMethod', ['<html><body>Congrats</body></html>'], this.callback)
      }
    , 'contains the CDATA-wrapped string' : function (error, xml) {
        assert.isNull(error)
        assert.equal(xml, '<?xml version="1.0"?><methodCall><methodName>testCDATAMethod</methodName><params><param><value><string><![CDATA[<html><body>Congrats</body></html>]]></string></value></param></params></methodCall>')
      }
    }
  , 'with a multi-line String param that requires CDATA' : {
      topic: function() {
        xmlrpcBuilder.buildMethodCall('testCDATAMethod', ['<html>\n<head><title>Go testing!</title></head>\n<body>Congrats</body>\n</html>'], this.callback)
      }
    , 'contains the CDATA-wrapped string' : function (error, xml) {
        assert.isNull(error)
        assert.equal(xml, '<?xml version="1.0"?><methodCall><methodName>testCDATAMethod</methodName><params><param><value><string><![CDATA[<html>\n<head><title>Go testing!</title></head>\n<body>Congrats</body>\n</html>]]></string></value></param></params></methodCall>')
      }
    }
  , 'with an empty String param' : {
      topic: function () {
        xmlrpcBuilder.buildMethodCall('testMethod', [''], this.callback)
      }
    , 'contains an empty string' : function (error, xml) {
        assert.isNull(error)
        assert.equal(xml, '<?xml version="1.0"?><methodCall><methodName>testMethod</methodName><params><param><value><string/></value></param></params></methodCall>')
      }
    }
    // Test Struct
  , 'with a one-level struct' : {
      topic: function () {
        xmlrpcBuilder.buildMethodCall('testMethod', [{stringName: 'string1', intName: 3}], this.callback)
      }
    , 'contains the struct' : function (error, xml) {
        assert.isNull(error)
        assert.equal(xml, '<?xml version="1.0"?><methodCall><methodName>testMethod</methodName><params><param><value><struct><member><name>stringName</name><value><string>string1</string></value></member><member><name>intName</name><value><int>3</int></value></member></struct></value></param></params></methodCall>')
      }
    }
    // FIXME Empty name causes warnings. Need to figure out what's the
    // spec way to define an empty string
  , 'with a one-level struct and an empty property name' : {
      topic: function () {
        xmlrpcBuilder.buildMethodCall('testMethod', [{stringName: '', intName: 3}], this.callback)
      }
    , 'contains the struct' : function (error, xml) {
        assert.isNull(error)
        assert.equal(xml, '<?xml version="1.0"?><methodCall><methodName>testMethod</methodName><params><param><value><struct><member><name/><value><string>string1</string></value></member><member><name>intName</name><value><int>3</int></value></member></struct></value></param></params></methodCall>')
      }
    }
  , 'with a two-level struct' : {
    topic: function () {
        xmlrpcBuilder.buildMethodCall('testMethod', [{stringName: 'string1', objectName: { intName: 4 }}], this.callback)
      }
    , 'contains the struct' : function (error, xml) {
        assert.isNull(error)
        assert.equal(xml, '<?xml version="1.0"?><methodCall><methodName>testMethod</methodName><params><param><value><struct><member><name>stringName</name><value><string>string1</string></value></member><member><name>objectName</name><value><struct><member><name>intName</name><value><int>4</int></value></member></struct></value></member></struct></value></param></params></methodCall>')
      }
    }
  }

  //////////////////////////////////////////////////////////////////////
  // Test buildMethodResponse functionality
  //////////////////////////////////////////////////////////////////////
, 'A buildMethodResponse call' : {
    // Test Array
    'with an Array param' : {
      topic: function () {
        xmlrpcBuilder.buildMethodResponse(['string1', 3], this.callback)
      }
    , 'contains the array' : function (error, xml) {
        assert.isNull(error)
        assert.equal(xml, '<?xml version="1.0"?><methodResponse><params><param><value><array><data><value><string>string1</string></value><value><int>3</int></value></data></array></value></param></params></methodResponse>')
      }
    }
    // Test Boolean
  , 'with a true Boolean param' : {
      topic: function () {
        xmlrpcBuilder.buildMethodResponse(true, this.callback)
      }
    , 'contains the value 1' : function (error, xml) {
        assert.isNull(error)
        assert.equal(xml, '<?xml version="1.0"?><methodResponse><params><param><value><boolean>1</boolean></value></param></params></methodResponse>')
      }
    }
    // Test Datetime
  , 'with a Datetime param' : {
      topic: function () {
        xmlrpcBuilder.buildMethodResponse(new Date(2012, 07, 07, 11, 35, 10), this.callback)
      }
    , 'contains the timestamp' : function (error, xml) {
        assert.isNull(error)
        assert.equal(xml, '<?xml version="1.0"?><methodResponse><params><param><value><dateTime.iso8601>20120807T11:35:10</dateTime.iso8601></value></param></params></methodResponse>')
      }
    }
    // Test Double
  , 'with a positive Double param' : {
      topic: function () {
        xmlrpcBuilder.buildMethodResponse(17.5, this.callback)
      }
    , 'contains the double' : function (error, xml) {
        assert.isNull(error)
        assert.equal(xml, '<?xml version="1.0"?><methodResponse><params><param><value><double>17.5</double></value></param></params></methodResponse>')
      }
    }
    // Test Fault
  , 'with a fault' : {
      topic: function () {
        xmlrpcBuilder.buildMethodResponseWithAFault({faultCode: 6, faultString: 'Incorrect parameter value.'}, this.callback)
      }
    , 'contains the fault' : function (error, xml) {
        assert.isNull(error)
        assert.equal(xml, '<?xml version="1.0"?><methodResponse><fault><value><struct><member><name>faultCode</name><value><int>6</int></value></member><member><name>faultString</name><value><string>Incorrect parameter value.</string></value></member></struct></value></fault></methodResponse>')
      }
    }
    // Test Integer
  , 'with a positive Interger param' : {
      topic: function () {
        xmlrpcBuilder.buildMethodResponse(17, this.callback)
      }
    , 'contains the Integer' : function (error, xml) {
        assert.isNull(error)
        assert.equal(xml, '<?xml version="1.0"?><methodResponse><params><param><value><int>17</int></value></param></params></methodResponse>')
      }
    }
    // Test String
  , 'with a regular String param' : {
      topic: function() {
        xmlrpcBuilder.buildMethodResponse('testString', this.callback)
      }
    , 'contains the string' : function (error, xml) {
        assert.isNull(error)
        assert.equal(xml, '<?xml version="1.0"?><methodResponse><params><param><value><string>testString</string></value></param></params></methodResponse>')
      }
    }
    // Test Struct
  , 'with a one-level struct' : {
      topic: function () {
        xmlrpcBuilder.buildMethodResponse({stringName: 'string1', intName: 3}, this.callback)
      }
    , 'contains the struct' : function (error, xml) {
        assert.isNull(error)
        assert.equal(xml, '<?xml version="1.0"?><methodResponse><params><param><value><struct><member><name>stringName</name><value><string>string1</string></value></member><member><name>intName</name><value><int>3</int></value></member></struct></value></param></params></methodResponse>')
      }
    }
  }

}).export(module)

