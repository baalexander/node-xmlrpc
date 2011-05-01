var vows          = require('vows')
  , assert        = require('assert')
  , xmlrpcBuilder = require('../lib/xmlrpc-builder.js')

vows.describe('XML-RPC Builder').addBatch({
  // Test buildMethodCall functionality
  'A buildMethodCall call' : {
    // Test String
    'with a regular String param' : {
      topic: function() {
        xmlrpcBuilder.buildMethodCall('testMethod', ['testString'], this.callback)
      }
    , 'contains the string' : function (err, xml) {
        assert.equal(xml, '<methodCall><methodName>testMethod</methodName><params><param><value><string>testString</string></value></param></params></methodCall>')
      }
    }
    // FIXME Empty string causes warnings. Need to figure out what's the
    // spec way to define an empty string
  , 'with an empty String param' : {
      topic: function () {
        xmlrpcBuilder.buildMethodCall('testMethod', [''], this.callback)
      }
    , 'contains an empty string' : function (err, xml) {
        assert.equal(xml, '<methodCall><methodName>testMethod</methodName><params><param><value><string/></value></param></params></methodCall>')
      }
    }
    // Test Integer
  , 'with a positive Interger param' : {
      topic: function () {
        xmlrpcBuilder.buildMethodCall('testMethod', [17], this.callback)
      }
    , 'contains the integer' : function (err, xml) {
        assert.equal(xml, '<methodCall><methodName>testMethod</methodName><params><param><value><int>17</int></value></param></params></methodCall>')
      }
    }
  , 'with a negative Integer param' : {
      topic: function () {
        xmlrpcBuilder.buildMethodCall('testMethod', [-32], this.callback)
      }
    , 'contains the negative integer' : function (err, xml) {
        assert.equal(xml, '<methodCall><methodName>testMethod</methodName><params><param><value><int>-32</int></value></param></params></methodCall>')
      }
    }
  , 'with an Integer param of 0' : {
      topic: function () {
        xmlrpcBuilder.buildMethodCall('testMethod', [0], this.callback)
      }
    , 'contains 0' : function (err, xml) {
        assert.equal(xml, '<methodCall><methodName>testMethod</methodName><params><param><value><int>0</int></value></param></params></methodCall>')
      }
    }
    // Test Double
  , 'with a positive Double param' : {
      topic: function () {
        xmlrpcBuilder.buildMethodCall('testMethod', [17.5], this.callback)
      }
    , 'contains the double' : function (err, xml) {
        assert.equal(xml, '<methodCall><methodName>testMethod</methodName><params><param><value><double>17.5</double></value></param></params></methodCall>')
      }
    }
  , 'with a negative Double param' : {
      topic: function () {
        xmlrpcBuilder.buildMethodCall('testMethod', [-32.7777], this.callback)
      }
    , 'contains the negative double' : function (err, xml) {
        assert.equal(xml, '<methodCall><methodName>testMethod</methodName><params><param><value><double>-32.7777</double></value></param></params></methodCall>')
      }
    }
    // Test Boolean
  , 'with a true Boolean param' : {
      topic: function () {
        xmlrpcBuilder.buildMethodCall('testMethod', [true], this.callback)
      }
    , 'contains the value 1' : function (err, xml) {
        assert.equal(xml, '<methodCall><methodName>testMethod</methodName><params><param><value><boolean>1</boolean></value></param></params></methodCall>')
      }
    }
  , 'with a false Boolean param' : {
      topic: function () {
        xmlrpcBuilder.buildMethodCall('testMethod', [false], this.callback)
      }
    , 'contains the value 0' : function (err, xml) {
        assert.equal(xml, '<methodCall><methodName>testMethod</methodName><params><param><value><boolean>0</boolean></value></param></params></methodCall>')
      }
    }
    // Test Datetime
  , 'with a Datetime param' : {
      topic: function () {
        xmlrpcBuilder.buildMethodCall('testMethod', [new Date(2012, 05, 07, 11, 35, 10)], this.callback)
      }
    , 'contains the timestamp' : function (err, xml) {
        assert.equal(xml, '<methodCall><methodName>testMethod</methodName><params><param><value><dateTime.iso8601>20120607T11:35:10</dateTime.iso8601></value></param></params></methodCall>')
      }
    }
    // Test Nil
  , 'with a Nil param' : {
      topic: function () {
        xmlrpcBuilder.buildMethodCall('testMethod', [null], this.callback)
      }
    , 'contains the nil' : function (err, xml) {
        assert.equal(xml, '<methodCall><methodName>testMethod</methodName><params><param><value><nil/></value></param></params></methodCall>')
      }
    }
    // Test Array
  , 'with an Array param' : {
      topic: function () {
        xmlrpcBuilder.buildMethodCall('testMethod', [['string1', 3]], this.callback)
      }
    , 'contains the array' : function (err, xml) {
        assert.equal(xml, '<methodCall><methodName>testMethod</methodName><params><param><value><array><data><value><string>string1</string></value><value><int>3</int></value></data></array></value></param></params></methodCall>')
      }
    }
    // Test Struct
  , 'with a one-level struct' : {
      topic: function () {
        xmlrpcBuilder.buildMethodCall('testMethod', [{stringName: 'string1', intName: 3}], this.callback)
      }
    , 'contains the struct' : function (err, xml) {
        assert.equal(xml, '<methodCall><methodName>testMethod</methodName><params><param><value><struct><member><name>stringName</name><value><string>string1</string></value></member><member><name>intName</name><value><int>3</int></value></member></struct></value></param></params></methodCall>')
      }
    }
    // FIXME Empty name causes warnings. Need to figure out what's the
    // spec way to define an empty string
  , 'with a one-level struct and an empty property name' : {
      topic: function () {
        xmlrpcBuilder.buildMethodCall('testMethod', [{stringName: '', intName: 3}], this.callback)
      }
    , 'contains the struct' : function (err, xml) {
        assert.equal(xml, '<methodCall><methodName>testMethod</methodName><params><param><value><struct><member><name/><value><string>string1</string></value></member><member><name>intName</name><value><int>3</int></value></member></struct></value></param></params></methodCall>')
      }
    }
  , 'with a two-level struct' : {
    topic: function () {
        xmlrpcBuilder.buildMethodCall('testMethod', [{stringName: 'string1', objectName: { intName: 4 }}], this.callback)
      }
    , 'contains the struct' : function (err, xml) {
        assert.equal(xml, '<methodCall><methodName>testMethod</methodName><params><param><value><struct><member><name>stringName</name><value><string>string1</string></value></member><member><name>objectName</name><value><struct><member><name>intName</name><value><int>4</int></value></member></struct></value></member></struct></value></param></params></methodCall>')
      }
    }
  }

}).export(module)
