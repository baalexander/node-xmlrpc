var vows         = require('vows')
  , assert       = require('assert')
  , xmlrpcParser = require('../lib/xmlrpc-parser.js')

vows.describe('XML-RPC Parser').addBatch({
  // Test createCallXml functionality
  'A createCallXml call' : {
    // Test String
    'with a regular String param' : {
      topic: xmlrpcParser.createCallXml('testMethod', ['testString'])
    , 'contains the string' : function (topic) {
        assert.equal(topic, '<methodCall><methodName>testMethod</methodName><params><param><value><string>testString</string></value></param></params></methodCall>')
      }
    }
    // FIXME Empty string causes warnings. Need to figure out what's the
    // spec way to define an empty string
  , 'with an empty String param' : {
      topic: xmlrpcParser.createCallXml('testMethod', [''])
    , 'contains an empty string' : function (topic) {
        assert.equal(topic, '<methodCall><methodName>testMethod</methodName><params><param><value><string/></value></param></params></methodCall>')
      }
    }
    // Test Integer
  , 'with a positive Interger param' : {
      topic: xmlrpcParser.createCallXml('testMethod', [17])
    , 'contains the integer' : function (topic) {
        assert.equal(topic, '<methodCall><methodName>testMethod</methodName><params><param><value><int>17</int></value></param></params></methodCall>')
      }
    }
  , 'with a negative Integer param' : {
      topic: xmlrpcParser.createCallXml('testMethod', [-32])
    , 'contains the negative integer' : function (topic) {
        assert.equal(topic, '<methodCall><methodName>testMethod</methodName><params><param><value><int>-32</int></value></param></params></methodCall>')
      }
    }
  , 'with an Integer param of 0' : {
      topic: xmlrpcParser.createCallXml('testMethod', [0])
    , 'contains 0' : function (topic) {
        assert.equal(topic, '<methodCall><methodName>testMethod</methodName><params><param><value><int>0</int></value></param></params></methodCall>')
      }
    }
    // Test Double
  , 'with a positive Double param' : {
      topic: xmlrpcParser.createCallXml('testMethod', [17.5])
    , 'contains the double' : function (topic) {
        assert.equal(topic, '<methodCall><methodName>testMethod</methodName><params><param><value><double>17.5</double></value></param></params></methodCall>')
      }
    }
  , 'with a negative Double param' : {
      topic: xmlrpcParser.createCallXml('testMethod', [-32.7777])
    , 'contains the negative double' : function (topic) {
        assert.equal(topic, '<methodCall><methodName>testMethod</methodName><params><param><value><double>-32.7777</double></value></param></params></methodCall>')
      }
    }
    // Test Boolean
  , 'with a true Boolean param' : {
      topic: xmlrpcParser.createCallXml('testMethod', [true])
    , 'contains the value 1' : function (topic) {
        assert.equal(topic, '<methodCall><methodName>testMethod</methodName><params><param><value><boolean>1</boolean></value></param></params></methodCall>')
      }
    }
  , 'with a false Boolean param' : {
      topic: xmlrpcParser.createCallXml('testMethod', [false])
    , 'contains the value 0' : function (topic) {
        assert.equal(topic, '<methodCall><methodName>testMethod</methodName><params><param><value><boolean>0</boolean></value></param></params></methodCall>')
      }
    }
    // Test Datetime
  , 'with a Datetime param' : {
      topic: xmlrpcParser.createCallXml('testMethod', [new Date(2012, 05, 07, 11, 35, 10)])
    , 'contains the timestamp' : function (topic) {
        assert.equal(topic, '<methodCall><methodName>testMethod</methodName><params><param><value><dateTime.iso8601>20120607T11:35:10</dateTime.iso8601></value></param></params></methodCall>')
      }
    }
    // Test Nil
  , 'with a Nil param' : {
      topic: xmlrpcParser.createCallXml('testMethod', [null])
    , 'contains the nil' : function (topic) {
        assert.equal(topic, '<methodCall><methodName>testMethod</methodName><params><param><value><nil/></value></param></params></methodCall>')
      }
    }
    // Test Array
  , 'with an Array param' : {
      topic: xmlrpcParser.createCallXml('testMethod', [['string1', 3]])
    , 'contains the array' : function (topic) {
        assert.equal(topic, '<methodCall><methodName>testMethod</methodName><params><param><value><array><data><value><string>string1</string></value><value><int>3</int></value></data></array></value></param></params></methodCall>')
      }
    }
    // Test Struct
  , 'with a one-level struct' : {
      topic: xmlrpcParser.createCallXml('testMethod', [{stringName: 'string1', intName: 3}])
    , 'contains the struct' : function (topic) {
        assert.equal(topic, '<methodCall><methodName>testMethod</methodName><params><param><value><struct><member><name>stringName</name><value><string>string1</string></value></member><member><name>intName</name><value><int>3</int></value></member></struct></value></param></params></methodCall>')
      }
    }
    // FIXME Empty name causes warnings. Need to figure out what's the
    // spec way to define an empty string
  , 'with a one-level struct and an empty property name' : {
      topic: xmlrpcParser.createCallXml('testMethod', [{stringName: '', intName: 3}])
    , 'contains the struct' : function (topic) {
        assert.equal(topic, '<methodCall><methodName>testMethod</methodName><params><param><value><struct><member><name/><value><string>string1</string></value></member><member><name>intName</name><value><int>3</int></value></member></struct></value></param></params></methodCall>')
      }
    }
  , 'with a two-level struct' : {
    topic: xmlrpcParser.createCallXml('testMethod', [{stringName: 'string1', objectName: { intName: 4 }}])
    , 'contains the struct' : function (topic) {
        assert.equal(topic, '<methodCall><methodName>testMethod</methodName><params><param><value><struct><member><name>stringName</name><value><string>string1</string></value></member><member><name>objectName</name><value><struct><member><name>intName</name><value><int>4</int></value></member></struct></value></member></struct></value></param></params></methodCall>')
      }
    }
  }

}).export(module)
