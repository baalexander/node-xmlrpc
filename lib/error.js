var error = require('tea-error')

var xmlrpc = exports

/**
 * The type to generate xml-rpc error
 */
xmlrpc.XmlRpcError = error('XmlRpcError');

/**
 * The helper function to create xml-rpc error
 * 
 * Examples:
 * // Makes an error with only message and default (zero 0) code
 * xmlrpc.makeError("Error occured")
 * // Makes an error with message and code
 * xmlrpc.makeError("Error occured", 123)
 *
 * @param {String} message The error message
 * @param {Number} code The error code
 *
 * @returns {XmlRpcError} The error object
 */
xmlrpc.makeError = function (message, code) {
	var msg = message;
	if ('object' === typeof message) {
		for (var i in message) {
			msg = message[i];
			// we need only one field
			break;
		}
	}
	return new xmlrpc.XmlRpcError(message, {codeArg: code});
}

/**
 * 
 * @param {XmlRpcError|Error|Object|String} error The error object
 * @returns {Object|String} The error object or string to send as a response
 */
xmlrpc.makeResponseObjectFromError = function(error) {
	var message = '';
	var code = 0;
	if (error instanceof xmlrpc.XmlRpcError) {
		message = error.message;
		if ('number' === typeof error.codeArg) {
			code = error.codeArg;
		}
	} else if (error instanceof Error) {
		message = (('' !== error.message) ? error.message : error.name);
	} else if (error instanceof Object) {
		message = error.toString();
	} else {
		message = error + '';
	}
	var fault = {};
	fault['faultString'] = message;
	fault['faultCode'] = code;
	return fault;
}
