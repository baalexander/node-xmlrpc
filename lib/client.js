var http       = require('http')
  , https      = require('https')
  , url        = require('url')
  , marshall   = require('./marshall')
  , unmarshall = require('./unmarshall')
  , utilities  = require('./utilities')
  , deepCopy   = utilities.deepCopy
  , invoke     = utilities.invoke
  ;

/**
 * Creates a Client object for making XML-RPC method calls.
 *
 * @constructor
 * @param {Object|String} options - Server options to make the HTTP request to.
 *                                  Either a URI string
 *                                  (e.g. 'http://localhost:9090') or an object
 *                                  with fields:
 *   - {String} host              - (optional)
 *   - {Number} port
 * @param {Boolean} isSecure      - True if using https for making calls,
 *                                  otherwise false.
 * @return {Client}
 */
function Client(options, isSecure) {

  // Invokes with new if called without
  if (false === (this instanceof Client)) {
    return new Client(options, isSecure)
  }

  // If a string URI is passed in, converts to URI fields
  if (typeof options === 'string') {
    options = url.parse(options)
    options.host = options.hostname
    options.path = options.pathname
  }

  // Set the HTTP request headers
  var headers = {
    'User-Agent'     : 'NodeJS XML-RPC Client'
  , 'Content-Type'   : 'text/xml'
  , 'Accept'         : 'text/xml'
  , 'Accept-Charset' : 'UTF8'
  , 'Connection'     : 'Keep-Alive'
  }
  options.headers = options.headers || {}

  if (options.headers.Authorization == null &&
      options.basic_auth != null &&
      options.basic_auth.user != null &&
      options.basic_auth.pass != null) {
    options.headers['Authorization'] = 'Basic ' + new Buffer(options.basic_auth.user + ":" + options.basic_auth.pass).toString('base64')
  }

  for (var attribute in headers) {
    if (options.headers[attribute] === undefined) {
      options.headers[attribute] = headers[attribute]
    }
  }

  options.method = 'POST'
  this.options = options

  this.isSecure = isSecure
}

/**
 * Makes an XML-RPC call to the server specified by the constructor's options.
 *
 * @param {String} method     - The method name.
 * @param {Array} params      - Params to send in the call.
 * @param {Function} callback - function(error, value) { ... }
 *   - {Object|null} error    - Any errors when making the call, otherwise null.
 *   - {mixed} value          - The value returned in the method response.
 */
Client.prototype.methodCall = function(method, params, callback) {
  var that = this
    , xml  = marshall.buildMethodCall(method, params)
    , opts = deepCopy(that.options)
    , transport = (that.isSecure) ? https : http
    ;

  opts.headers['Content-Length'] = xml.length

  function on_result(error, result) {
    // The unmarshaller always returns an array. When handling a method response
    // we just return the first element.
    callback(error, result ? result[0] : undefined)
  }
  var request = transport.request(that.options, function(result) {
    var u = new unmarshall.Unmarshaller(on_result)
    result.on('data',  invoke(u, 'write'))
    result.on('end',   invoke(u, 'close'))
    result.on('error', callback)
    result.setEncoding('utf8')
  })

  request.on('error', callback)
  request.write(xml, 'utf8')
  request.end()

}

module.exports = Client

