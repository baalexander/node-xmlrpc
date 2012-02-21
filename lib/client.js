var http     = require('http')
  , https    = require('https')
  , url      = require('url')
  , marshall = require('./marshall')

  , unmarshallResponse = require('./unmarshall').unmarshallResponse
  

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
      options.basic_auth.pass != null)
  {
    var auth = options.basic_auth.user + ":" + options.basic_auth.pass
    options.headers['Authorization'] = 'Basic ' + new Buffer(auth).toString('base64')
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
  var xml  = marshall.marshallCall(method, params)
    , transport = this.isSecure ? https : http

  this.options.headers['Content-Length'] = xml.length

  function on_response(response) { unmarshallResponse(response, callback) }
  var request = transport.request(this.options, on_response);
  request.on('error', callback)
  request.write(xml, 'utf8')
  request.end()

}

module.exports = Client


