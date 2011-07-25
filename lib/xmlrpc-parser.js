var xmlParser     = require('node-xml')
  , dateFormatter = require('./date-formatter.js')

var xmlrpcParser = exports

/**
 * Parses an XML-RPC method call.
 *
 * @param {String} xml - the XML string to parse
 * @param {Function} callback - function (error, value) { ... }
 *   - {Object|null} error - any errors that occurred while parsing, otherwise
 *     null
 *   - {Object} method - the method name
 *   - {Array} params - array containing the passed in parameters
 */
xmlrpcParser.parseMethodCall = function(xml, callback) {

  var saxParser = new xmlParser.SaxParser(function(parser) {

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
 * @param {String} xml - the XML string to parse
 * @param {Function} callback - function (error, value) { ... }
 *   - {Object|null} error - any errors that occurred while parsing, otherwise
 *     null
 *   - {Object} value - value returned in the method response
 */
 
xmlrpcParser.parseMethodResponse = function(existingParser, xml, callback) {
  if (existingParser == null) { 
	  existingParser = new xmlParser.SaxParser(function(parser) {
        deserializeParams(parser, function (error, params, parser) {
        // There should be only one param returned from a methodResponse
        var value = null
        if (params !== undefined
          && params !== null
          && params.constructor.name == 'Array'
          && params.length > 0) {
          value = params[0]
        }
        callback(error, value)
      })
    })
  }

  existingParser.parseString(xml)
  return existingParser
}

function resetListeners(parser, startElementListener) {
  // Removes listeners to prevent them from being fired on parsing events when
  // they shouldn't.

  // Ignore any characters encountered between elements. Like newlines and
  // spaces.
  parser.onCharacters(function() {})

  // Make sure the right new element handler is listening
  parser.onStartElementNS(startElementListener)

  // Ignore any end elements encountered, as likely already returned from the
  // element being paid attention to
  parser.onEndElementNS(function() {})
}

function deserializeMethod(parser, callback) {

  parser.onStartElementNS(function(element, attributes, prefix, uri, namespaces) {
    if (element === 'methodName') {
      parser.onCharacters(function(method) {
        callback(null, method, parser)
      })
    }
  })
}

function deserializeParams(parser, callback) {
  var fault = null
  var params = []

  // Returns the array of params when finished
  parser.onEndDocument(function() {
    if (fault !== null) {
      callback(fault, null, parser)
    }
    else {
      callback(null, params, parser)
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
    var isFlatParam = false
    var flatParams = ['boolean', 'dateTime.iso8601', 'double', 'int', 'i4', 'string', 'nil']
    for (var i = 0; i < flatParams.length && !isFlatParam; i++) {
      if (flatParams[i] === element) {
        isFlatParam = true
      }
    }

    // A non-nested parameter. These simple values can be returned immediately.
    if (isFlatParam) {
      // Coerce the characters into the proper type
      parser.onCharacters(function(chars) {
        var param = null
        switch (element) {
          case 'boolean':
            if (chars === '1') {
              param = true
            }
            else {
              param = false
            }
            break
          case 'dateTime.iso8601':
            param = dateFormatter.decodeIso8601(chars)
            break
          case 'double':
            param = parseFloat(chars)
            break
          case 'i4':
          case 'int':
            param = parseInt(chars)
            break
          case 'string':
            param = chars
            break
        }
        callback(null, param, parser)
      })

      // The On End Element event will only be reached for empty elements (like
      // <string/>), since the On Characters event would have returned
      // otherwise.
      // The appropriate empty value for the element will be returned.
      parser.onEndElementNS(function(element, prefix, uri) {
        var param = null
        switch (element) {
          case 'string':
            param = ''
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

  function handleStartElement(element, attributes, prefix, uri, namespaces) {
    // Parse each element in the array XML (denoted by element 'value') and adds
    // to the array
    if (element === 'value') {
      deserializeParam(parser, function(error, value, parser) {
        // Ignores whitespacing and sets correct new element listener
        resetListeners(parser, handleStartElement)
        values.push(value)

        // If hits the end of this array XML, return the values
        parser.onEndElementNS(function(element, prefix, uri) {
          if (element === 'array') {
            callback(null, values)
          }
        })

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

