var http             = require('http')
  , https            = require('https')
  , url              = require('url')
  , EventEmitter     = require('events').EventEmitter
  , Serializer       = require('./serializer')
  , Deserializer     = require('./deserializer')
  , xmlrpcError      = require('./error')

/**
 * Creates a new Server object. Also optionally creates a HTTP server to start listening
 * for XML-RPC method calls. Will emit an event with the XML-RPC call's method
 * name when receiving a method call.
 *
 * @constructor
 * @param {Object|String} options - The HTTP server options. Either a URI string
 *                                  (e.g. 'http://localhost:9090') or an object
 *                                  with fields:
 *   - {http.Server}  httpServer  - (optional) The external http server object
 *   If supplied, the request handler is supposed to be registered
 *   by the user himself: server.requestHandler
 *   - {String}  anyMethodName    - (optional) The special method name.
 *   If supplied, all incoming request would be routed to it if not found in specific events.
 *   The actual method name requested is given in a first element of the params array in a callback.
 *   - {String}  host             - (optional)
 *   - {Number}  port
 * @param {Boolean} isSecure      - True if using https for making calls,
 *                                  otherwise false.
 * @return {Server}
 */
function Server(options, isSecure, onListening) {

	if (false === (this instanceof Server)) {
		return new Server(options, isSecure)
	}
	onListening = onListening || function() {}
	var that = this

	// If a string URI is passed in, converts to URI fields
	if (typeof options === 'string') {
		options = url.parse(options)
		options.host = options.hostname
		options.path = options.pathname
	}

	function _callback(response, error, value) {
		var xml = null;
		if (error !== null) {
			var fault = xmlrpcError.makeResponseObjectFromError(error);
			xml = Serializer.serializeFault(fault);
		}
		else {
			xml = Serializer.serializeMethodResponse(value);
		}
		response.writeHead(200, {'Content-Type': 'text/xml'});
		response.end(xml);
	}
	
	function _deserializeMethodCallback(request, response, error, methodName, params) {
		if (that._events.hasOwnProperty(methodName)) {
			that.emit(methodName, null/*error*/, params, _callback.bind(null, response), request, response);
		}
		else if (options.anyMethodName && that._events.hasOwnProperty(options.anyMethodName)) {
			// Add the methodName as a first element to params
			params.splice(0, 0, methodName);
			that.emit(options.anyMethodName, null/*error*/, params, _callback.bind(null, response), request, response);
		}
		else {
			that.emit('NotFound', methodName/*error*/, params);
			response.writeHead(404);
			response.end();
		}
    }
	
	function _socketDestroy(socket) {
		socket.destroy();
	}
	
	function _finishCallback(socket) {
		socket.removeAllListeners('timeout');
		socket.setTimeout(5000, _socketDestroy.bind(null, socket));
	}

	function handleMethodCall(request, response) {
		// node.js bug with slow socket release workaround
		// @see http://habrahabr.ru/post/264851/
		var socket = request.socket;
		response.on('finish', _finishCallback.bind(null, socket));

		var deserializer = new Deserializer();
		deserializer.deserializeMethodCall(request, _deserializeMethodCallback.bind(null, request, response));
	}
	this.requestHandler = handleMethodCall;

	if (options.httpServer) {
		this.httpServer = options.httpServer;
	} else {
		if (isSecure) {
			this.httpServer = https.createServer(options, handleMethodCall);
		} else {
			this.httpServer = http.createServer(handleMethodCall);
		}
		process.nextTick(function() {
			this.httpServer.listen(options.port, options.host, onListening)
		}.bind(this))
		this.close = function(callback) {
			this.httpServer.once('close', callback)
			this.httpServer.close()
		}.bind(this)
	}
}

// Inherit from EventEmitter to emit and listen
Server.prototype.__proto__ = EventEmitter.prototype

module.exports = Server

