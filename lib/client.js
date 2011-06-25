var http          = require('http')
  , https         = require('https')
  , xmlrpcBuilder = require('./xmlrpc-builder.js')
  , xmlrpcParser  = require('./xmlrpc-parser.js')

/**
 * Creates a Client object for making XML-RPC method calls.
 *
 * @constructor
 * @param {Object} options - server options to make the HTTP request to
 *   - {String} host
 *   - {Number} port
 * @param {Boolean} isSecure - true if using https for making calls, otherwise
 *   false
 * @return {Client}
 */
function Client(options, isSecure) {

  // Invokes with new if called without
  if (false === (this instanceof Client)) {
    return new Client(options, isSecure)
  }

  options.method = 'POST'
  options.headers = {
    "User-Agent"     : "NodeJS XML-RPC Client"
  , "Content-Type"   : "text/xml"
  , "Accept"         : "text/xml"
  , "Accept-Charset" : "UTF8"
  }

  this.options = options

  this.isSecure = (isSecure === true) ? true : false
}

/**
 * Makes an XML-RPC call to the server specified by the constructor's options.
 *
 * @param {String} method - the method name
 * @param {Array} params - params to send in the call
 * @param {Function} callback - function(error, value)
 *   - {Object|null} error - any errors when making the call, otherwise null
 *   - {mixed} value - the value returned in the method response
 */
Client.prototype.call = function(method, params, callback) {
  var that = this

  // Creates the XML to send
  xmlrpcBuilder.buildMethodCall(method, params, function(error, xml) {

    that.options.headers['Content-Length'] = xml.length

    // Uses HTTPS to send request if specified
    var httpRequester = (that.isSecure) ? https : http

    // POSTs the XML to the server
    var request = httpRequester.request(that.options, function(result) {
      // Parses the method response and returns the value
      result.setEncoding('utf8')
      result.on('data', function(chunk) {
        xmlrpcParser.parseMethodResponse(chunk, callback)
      })
      result.on('error', function(error) {
        callback(error, null)
      })
    })

    request.on('error', function(error) {
      callback(error, null)
    })

    request.write(xml, 'utf8')
    request.end()
  })

}

module.exports = Client

