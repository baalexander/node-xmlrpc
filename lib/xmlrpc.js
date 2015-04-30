var Client = require('./client')
  , Server = require('./server')
  , CustomType = require('./customtype')
  , dateFormatter = require('./date_formatter')
  , Serializer = require('./serializer')
  , Deserializer = require('./deserializer')

var xmlrpc = exports

/**
 * Creates an XML-RPC client.
 *
 * @param {Object} options - server options to make the HTTP request to
 *   - {String} host
 *   - {Number} port
 *   - {String} url
 *   - {Boolean} cookies
 * @return {Client}
 * @see Client
 */
xmlrpc.createClient = function(options) {
  return new Client(options, false)
}

/**
 * Creates an XML-RPC client that makes calls using HTTPS.
 *
 * @param {Object} options - server options to make the HTTP request to
 *   - {String} host
 *   - {Number} port
 *   - {String} url
 *   - {Boolean} cookies
 * @return {Client}
 * @see Client
 */
xmlrpc.createSecureClient = function(options) {
  return new Client(options, true)
}

/**
 * Creates an XML-RPC server.
 *
 * @param {Object}options - the HTTP server options
 *   - {String} host
 *   - {Number} port
 * @return {Server}
 * @see Server
 */
xmlrpc.createServer = function(options, callback) {
  return new Server(options, false, callback)
}

/**
 * Creates an XML-RPC server that uses HTTPS.
 *
 * @param {Object}options - the HTTP server options
 *   - {String} host
 *   - {Number} port
 * @return {Server}
 * @see Server
 */
xmlrpc.createSecureServer = function(options, callback) {
  return new Server(options, true, callback)
}

/**
 * Express.js middleware.
 *
 * @param {Object} routes
 * @param {Function} notFound function
 */
xmlrpc.middleware = function(routes, notFoundFn) {
  return function(req, res) {
    var deserializer = new Deserializer();

    var callback = function(error, value) {
      res.writeHead(200, {'Content-Type': 'text/xml'});
      if (error !== null) {
        return res.end(Serializer.serializeFault(error));
      } else {
        return res.end(Serializer.serializeMethodResponse(value));
      }
    };

    return deserializer.deserializeMethodCall(req, function(error, methodName, params) {
      if (routes.hasOwnProperty(methodName)) {
        return routes[methodName].apply(null, params.concat(callback));
      }

      // Method not found
      if (typeof notFoundFn === 'function') {
        notFoundFn(methodName, params);
      }
      res.writeHead(404);
      return res.end();
    });
  };
};

xmlrpc.CustomType = CustomType
xmlrpc.dateFormatter = dateFormatter
