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
 * // Makes an error with only message and no code
 * xmlrpc.makeError("Error occured")
 * // Makes an error with message in a field named 'message' and code in a field named 'code'
 * xmlrpc.makeError("Error occured", 123)
 * // Makes an error with message in a field named 'faultString' and code in a field named 'faultCode'
 * xmlrpc.makeError({faultString: "Error occured"}, {faultCode: 123})
 *
 * @param {String|Object} message The error message or object like {faultString: "Error occured"}
 * @param {Number|Object} code The error code or object like {faultCode: 123}
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
	return new xmlrpc.XmlRpcError(msg, {messageArg: message, codeArg: code});
}

/**
 * 
 * @param {XmlRpcError|Error|Object|String} error The error object
 * @returns {Object|String} The error object or string to send as a response
 */
xmlrpc.makeResponseObjectFromError = function(error) {
	if (error instanceof xmlrpc.XmlRpcError) {
		var messageFieldName = 'message';
		var message = error.message;
		if ('undefined' !== typeof error.messageArg) {
			if ('string' === typeof error.messageArg) {
				message = error.messageArg;
			} else if ('object' === typeof error.messageArg) {
				for (var i in error.messageArg) {
					messageFieldName = i;
					message = error.messageArg[i];
					// we need only one field
					break;
				}
			}
		}
		var codeFieldName = 'code';
		var code = undefined;
		if ('undefined' !== typeof error.codeArg) {
			if ('number' === typeof error.codeArg) {
				code = error.codeArg;
			} else if ('object' === typeof error.codeArg) {
				for (var j in error.codeArg) {
					codeFieldName = j;
					code = error.codeArg[j];
					// we need only one field
					break;
				}
			}
		}
		var fault = message;
		if ('undefined' !== typeof code) {
			fault = {};
			fault[messageFieldName] = message;
			fault[codeFieldName] = code;
		}
		return fault;
	} else if (error instanceof Error) {
		return (('' !== error.message) ? error.message : error.name);
	} else if (error instanceof Object) {
		return error.toString();
	}
	return error + '';
}
