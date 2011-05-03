var http          = require('http')
  , xmlrpcBuilder = require('./xmlrpc-builder.js')
  , xmlrpcParser  = require('./xmlrpc-parser.js')

/**
 * Creates a Client object for making XML-RPC method calls.
 *
 * @constructor
 * @param {Object} options - server options to make the HTTP request to
 *   - {String} host
 *   - {Number} port
 * @return {Client}
 */
function Client(requestOptions) {

  // Invokes with new if called without
  if (false === (this instanceof Client)) {
    return new Client(requestOptions)
  }

  requestOptions.method = 'POST'
  requestOptions.headers = {
    "User-Agent"     : "NodeJS XML-RPC Client"
  , "Content-Type"   : "text/xml"
  , "Accept"         : "text/xml"
  , "Accept-Charset" : "UTF8"
  }

  this.requestOptions = requestOptions
}

/**
 * Makes an XML-RPC call to the server specified by the constructor's
 * options.
 *
 * @param {String} method - the method name
 * @param {Array} params - params to send in the call
 * @param {Function} callback - function(error, value)
 *   - {Object|null} error - any errors when making the call, otherwise
 *     null
 *   - {mixed} value - the value returned in the method response
 */
Client.prototype.call = function(method, params, callback) {
  var that = this

  // Creates the XML to send
  xmlrpcBuilder.buildMethodCall(method, params, function(err, xml) {

    that.requestOptions.headers['Content-Length'] = xml.length
    // POSTs the XML to the server
    var req = http.request(that.requestOptions, function(res) {
      // Parses the method response and returns the value
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        xmlrpcParser.parseMethodResponse(chunk, callback)
      })
    })

    req.write(xml, 'utf8')
    req.end()
  })

}

module.exports = Client

