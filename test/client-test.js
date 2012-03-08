var vows   = require('vows')
  , assert = require('assert')
  , http   = require('http')
  , fs     = require('fs')
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
        var headers = {
          'User-Agent': 'NodeJS XML-RPC Client'
        , 'Content-Type': 'text/xml'
        , 'Accept': 'text/xml'
        , 'Accept-Charset': 'UTF8'
        , 'Connection': 'Keep-Alive'
        }
        assert.deepEqual(topic, { host: 'localhost', port: 9999, path: '/', method: 'POST', headers: headers })
      }
    }
    // Test passing string URI for options
  , 'with a string URI for options' : {
      topic: function () {
        var client = new Client('http://localhost:9999', false)
        return client.options
      }
    , 'parses the string URI into URI fields' : function (topic) {
        assert.strictEqual(topic.host, 'localhost')
        assert.strictEqual(topic.path, '/')
        assert.equal(topic.port, 9999)
      }
    }
    // Test passing custom headers to the Client
  , 'with options containing header params' : {
      topic: function () {
        var client = new Client({ host: 'localhost', port: 9999, path: '/', headers: { 'User-Agent': 'Testaroo', 'Authorization': 'Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==' }}, false)
        return client.options
      }
    , 'does not overwrite the custom headers' : function (topic) {
        var headers = {
          'User-Agent': 'Testaroo'
        , 'Authorization': 'Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ=='
        , 'Content-Type': 'text/xml'
        , 'Accept': 'text/xml'
        , 'Accept-Charset' : 'UTF8'
        , 'Connection': 'Keep-Alive'
        }
        assert.deepEqual(topic, { host: 'localhost', port: 9999, path: '/', method: 'POST', headers: headers })
      }
    }
    // Test passing HTTP Basic authentication credentials
  , 'with basic auth passed' : {
      topic: function () {
        var client = new Client({ basic_auth: { user: 'john', pass: '12345' } }, false)
        return client.options.headers
      }
    , 'correctly encodes and sets the \'Authorization\' header' : function (topic) {
        assert.isNotNull(topic.Authorization)
        assert.equal(topic.Authorization, "Basic am9objoxMjM0NQ==")
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
  , 'with a string URI for options' : {
      topic: function () {
        var that = this
        // Basic http server that sends a chunked XML response
        http.createServer(function (request, response) {
            response.writeHead(200, {'Content-Type': 'text/xml'})
            var data = '<?xml version="2.0" encoding="UTF-8"?>'
              + '<methodResponse>'
              + '<params>'
              + '<param><value><string>more.listMethods</string></value></param>'
              + '</params>'
              + '</methodResponse>'
            response.write(data)
            response.end()
        }).listen(9090, 'localhost')
        // Waits briefly to give the server time to start up and start listening
        setTimeout(function () {
          var client = new Client('http://localhost:9090', false)
          client.methodCall('listMethods', null, that.callback)
        }, 500)
      }
    , 'contains the string' : function (error, value) {
        assert.isNull(error)
        assert.deepEqual(value, 'more.listMethods')
      }
    }
  , 'with no host specified' : {
      topic: function () {
        var that = this
        // Basic http server that sends a chunked XML response
        http.createServer(function (request, response) {
            response.writeHead(200, {'Content-Type': 'text/xml'})
            var data = '<?xml version="2.0" encoding="UTF-8"?>'
              + '<methodResponse>'
              + '<params>'
              + '<param><value><string>system.listMethods</string></value></param>'
              + '</params>'
              + '</methodResponse>'
            response.write(data)
            response.end()
        }).listen(9091, 'localhost')
        // Waits briefly to give the server time to start up and start listening
        setTimeout(function () {
          var client = new Client({ port: 9091, path: '/'}, false)
          client.methodCall('listMethods', null, that.callback)
        }, 500)
      }
    , 'contains the string' : function (error, value) {
        assert.isNull(error)
        assert.deepEqual(value, 'system.listMethods')
      }
    }
  , 'with a chunked response' : {
      topic: function () {
        var that = this
        // Basic http server that sends a chunked XML response
        http.createServer(function (request, response) {
          response.writeHead(200, {'Content-Type': 'text/xml'})
          var chunk1 = '<?xml version="2.0" encoding="UTF-8"?>'
            + '<methodResponse>'
            + '<params>'
            + '<param><value><array><data>'
            + '<value><string>system.listMethods</string></value>'
            + '<value><string>system.methodSignature</string></value>'
          var chunk2 = '<value><string>xmlrpc_dialect</string></value>'
            + '</data></array></value></param>'
            + '</params>'
            + '</methodResponse>'
          response.write(chunk1)
          response.write(chunk2)
          response.end()
        }).listen(9092, 'localhost')
        // Waits briefly to give the server time to start up and start listening
        setTimeout(function () {
          var client = new Client({ host: 'localhost', port: 9092, path: '/'}, false)
          client.methodCall('listMethods', null, that.callback)
        }, 500)
      }
    , 'contains the array' : function (error, value) {
        assert.isNull(error)
        assert.deepEqual(value, ['system.listMethods', 'system.methodSignature', 'xmlrpc_dialect'])
      }
    }
    , 'with a utf-8 encoding' : {
        topic: function () {
          var that = this
          http.createServer(function (request, response) {
              response.writeHead(200, {'Content-Type': 'text/xml'})
              var data = '<?xml version="2.0" encoding="UTF-8"?>'
                + '<methodResponse>'
                + '<params>'
                + '<param><value><string>here is mr. Snowman: ☃</string></value></param>'
                + '</params>'
                + '</methodResponse>'
              response.write(data)
              response.end()
          }).listen(9093, 'localhost')
          // Waits briefly to give the server time to start up and start listening
          setTimeout(function () {
            var client = new Client('http://localhost:9093', false)
            client.methodCall('listMethods', null, that.callback)
          }, 500)
        }
      , 'contains the correct string' : function (error, value) {
          assert.isNull(error)
          assert.deepEqual(value, 'here is mr. Snowman: ☃')
        }
      }
    , 'with a ISO-8859-1 encoding' : {
        topic: function () {
          var that = this
          http.createServer(function (request, response) {
              response.writeHead(200, {'Content-Type': 'text/xml'})
              // To prevent including a npm package that needs to compile (iconv):
              // The following iso 8859-1 text below in hex
              //   <?xml version="1.0" encoding="ISO-8859-1"?>
              //   <methodResponse>
              //   <params>
              //   <param><value><string>äè12</string></value></param>
              //   </params>
              //   </methodResponse>
              var hex = '3c3f786d6c2076657273696f6e3d22312e302220656e636'
                + 'f64696e673d2249534f2d383835392d31223f3e3c6d6574686f64'
                + '526573706f6e73653e3c706172616d733e3c706172616d3e3c766'
                + '16c75653e3c737472696e673ee4e831323c2f737472696e673e3c'
                + '2f76616c75653e3c2f706172616d3e3c2f706172616d733e3c2f6'
                + 'd6574686f64526573706f6e73653e'
              hexData = new Buffer(hex,'hex')
              response.write(hexData)
              response.end()
          }).listen(9094, 'localhost')
          // Waits briefly to give the server time to start up and start listening
          setTimeout(function () {
            var client = new Client({ host: 'localhost', port: 9094, path: '/', responseEncoding : 'binary'}, false)
            client.methodCall('listMethods', null, that.callback)
          }, 500)
        }
      , 'contains the correct string' : function (error, value) {
          assert.isNull(error)
          assert.deepEqual(value, 'äè12')
        }
      }
    /* // Test long method response, which requires multiple chunks returned from
    // the http request
    // Only one test relying on HTTP server can be used. See Issue #20.
  , 'with a very long response' : {
      topic: function () {
        var that = this
        // Basic http server that sends a long XML response (stored in file to
        // avoid cluttering up the test cases)
        http.createServer(function (request, result) {
          fs.readFile(__dirname + '/listMethods.xml', function (error, data) {
            result.writeHead(200, {'Content-Type': 'text/xml'})
            var xml = data + ''
            var chunk1 = xml.substring(0, xml.length / 2)
            result.write(chunk1)
            var chunk2 = xml.substring(xml.length / 2, xml.length)
            result.write(chunk2)
            result.end()
          })
        }).listen(9091, 'localhost')
        // Waits briefly to give the server time to start up and start listening
        setTimeout(function () {
          var client = new Client({ host: 'localhost', port: 9091, path: '/'}, false)
          client.methodCall('listMethods', null, that.callback)
        }, 500)
      }
    , 'contains the array' : function (error, value) {
        // Reads in the expected response as JSON and compares
        var data = fs.readFileSync(__dirname + '/listMethods.json')
        assert.deepEqual(value, JSON.parse(data))
      }
    } */
  }
}).export(module)
