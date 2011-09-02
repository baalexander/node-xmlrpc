var xmlParser     = require('node-xml')
  , dateFormatter = require('./date-formatter.js')

var xmlrpcParser = exports

/**
 * Parses an XML-RPC method call.
 *
 * @param {String} xml        - The XML string to parse.
 * @param {Function} callback - function (error, value) { ... }
 *   - {Object|null} error    - Any errors that occurred while parsing,
 *                              otherwise null.
 *   - {Object} method        - The method name.
 *   - {Array} params         - Array containing the passed in parameters.
 */
xmlrpcParser.parseMethodCall = function(xml, callback) {

  var saxParser = new xmlParser.SaxParser(function(parser) {
    parser._endOfDocument = false
    parser._stream = ''

    // Parses the method name
    deserializeMethod(parser, function(error, method, parser) {
      // Ignores whitespace encountered before params
      resetListeners(parser, function() {})

      // Parses the params
      deserializeParams(parser, function (error, params, parser) {
        callback(error, method, params)
      })
    })
  })

  saxParser.parseString(xml)
}

/**
 * Parses an XML-RPC method response.
 *
 * @param {SaxParser} xml     - The node-xml SaxParser.
 * @param {String} xml        - The XML string to parse.
 * @param {Function} callback - function (error, value) { ... }
 *   - {Object|null} error    - Any errors that occurred while parsing,
 *                              otherwise null.
 *   - {Object} value         - Value returned in the method response
 */
xmlrpcParser.parseMethodResponse = function(parser, xml, callback) {
  if (parser === null) {
    parser = new xmlParser.SaxParser(function(parser) {
      parser._endOfDocument = false
      parser._stream = ''
      deserializeParams(parser, function (error, params, parser) {
        // There should be only one param returned from a methodResponse
        var value = null
        if (params !== undefined
          && params !== null
          && Array.isArray(params)
          && params.length > 0) {
          value = params[0]
        }

        // Ensure that the error that was passed is an Error instance.
        var err;
        if (error) {
          err = new Error(error.faultString);
          err.code = err.faultCode = error.faultCode;
          err.faultString = error.faultString;
        }

        callback(err, value)
      })
    })
  }

  parser.parseString(xml)
  return parser
}

function resetListeners(parser, startElementListener) {
  // Removes listeners to prevent them from being fired on parsing events when
  // they shouldn't.

  // Make sure the right new element handler is listening
  parser.onStartElementNS(startElementListener)

  // Ignore whitespace in between elements
  parser.onCharacters(function(chars) { })

  // Listen for end of XML-RPC calls
  parser.onEndElementNS(function(element) {
    if (element === 'params' || element === 'fault') {
      parser._endOfDocument = true
    }
  })
}

function deserializeMethod(parser, callback) {

  parser.onStartElementNS(function(element, attributes, prefix, uri, namespaces) {
    if (element === 'methodName') {
      parser.onCharacters(function(method) {
        captureStream(parser, method)
      })

      parser.onEndElementNS(function() {
        callback(null, fetchStream(parser), parser)
      })
    }
  })
}

function deserializeParams(parser, callback) {
  var fault = null
  var params = []

  // Returns the array of params when finished
  parser.onEndDocument(function() {
    if (parser._endOfDocument) {
      if (fault !== null) {
        callback(fault, null, parser)
      }
      else {
        callback(null, params, parser)
      }
    }
  })

  parser.onStartElementNS(handleStartElement)

  function handleStartElement(element, attributes, prefix, uri, namespaces) {
    // Parses each param in the message
    if (element === 'param') {
      deserializeParam(parser, function (error, param, parser) {
        // Ignores whitespacing and sets correct new element listener
        resetListeners(parser, handleStartElement)
        params.push(param)
      })
    }
    // If the message response is a fault, parse the error
    else if (element === 'fault') {
      deserializeParam(parser, function (error, value, parser) {
        resetListeners(parser, handleStartElement)
        fault = value
      })
    }
  }

}

function deserializeParam(parser, callback) {

  parser.onStartElementNS(function(element, attributes, prefix, uri, namespaces) {
    // Checks if element is an XML-RPC data type
    var flatParams = ['boolean', 'dateTime.iso8601', 'double', 'int', 'i4', 'string', 'nil']
    var isFlatParam = ~flatParams.indexOf(element);

    // A non-nested parameter. These simple values can be returned immediately.
    if (isFlatParam) {
      // Coerce the characters into the proper type
      parser.onCharacters(function(chars) {
        // Stream the additional data to the message buffer
        captureStream(parser, chars)
      })

      // The On End Element event will only be reached for empty elements (like
      // <string/>), since the On Characters event would have returned
      // otherwise.
      // The appropriate empty value for the element will be returned.
      parser.onEndElementNS(function(element, prefix, uri) {
        var message = fetchStream(parser)

        var param = null
        switch (element) {
          case 'boolean':
            if (message === '1') {
              param = true
            }
            else {
              param = false
            }
            break
          case 'dateTime.iso8601':
            param = dateFormatter.decodeIso8601(message)
            break
          case 'double':
            param = parseFloat(message)
            break
          case 'i4':
          case 'int':
            param = parseInt(message)
            break
          case 'string':
            param = message
            break
        }

        callback(null, param, parser)
      })
    }
    // An Array must handle multiple values and possibly nested values too
    else if (element === 'array') {
      deserializeArrayParam(parser, function (error, param) {
        callback(null, param, parser)
      })
    }
    // A Struct must handle multiple values and possibly nested values too
    else if (element === 'struct') {
      deserializeStructParam(parser, function (error, param) {
        callback(null, param, parser)
      })
    }
  })
}

function deserializeArrayParam(parser, callback) {
  var values = []

  parser.onStartElementNS(handleStartElement)

  function checkForArray (element) {
    if (element === 'array') {
      callback(null, values)
    }
  }

  function handleStartElement(element, attributes, prefix, uri, namespaces) {
    // <array>s have a single mandatory <data> tag inside of them. If this is
    // the <data> tag, then set a listener checking for </array>
    if (element === 'data') {
      parser.onEndElementNS(checkForArray)
    }
    // Parse each element in the array XML (denoted by element 'value') and adds
    // to the array
    if (element === 'value') {
      deserializeParam(parser, function(error, value, parser) {
        // Ignores whitespacing and sets correct new element listener
        resetListeners(parser, handleStartElement)
        values.push(value)

        // If hits the end of this array XML, return the values
        parser.onEndElementNS(checkForArray)
      })
    }
  }
}

function deserializeStructParam(parser, callback) {
  var struct = {}
    , name = null

  parser.onStartElementNS(handleStartElement)

  function handleStartElement(element, attributes, prefix, uri, namespaces) {
    // Parse each member in the struct XML (denoted by element 'member') and
    // adds to the object
    if (element === 'name') {
      parser.onCharacters(function(chars) {
        name = chars
      })
      parser.onEndElementNS(function(element, prefix, url) {
        resetListeners(parser, handleStartElement)
      })
    }
    if (element === 'value') {
      deserializeParam(parser, function(error, value, parser) {
        // Ignores whitespacing and sets correct new element listener
        resetListeners(parser, handleStartElement)

        // If hits the end of this struct XML, return the object
        struct[name] = value
        parser.onEndElementNS(function(element, prefix, uri) {
          if (element === 'struct') {
            callback(null, struct)
          }
        })

      })
    }
  }
}

function captureStream(parser, chars) {
  parser._stream += chars
}

function fetchStream(parser) {
  var trimmedStream = parser._stream.trim()
  parser._stream = ''
  return trimmedStream
}
