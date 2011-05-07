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
xmlrpcParser.parseMethodResponse = function(xml, callback) {

  var saxParser = new xmlParser.SaxParser(function(parser) {

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

  saxParser.parseString(xml)
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
        // Override the listener, otherwise the wrong function will handle the
        // new elements event
        parser.onStartElementNS(handleStartElement)
        params.push(param)
      })
    }
    // If the message response is a fault, parse the error
    else if (element === 'fault') {
      deserializeParam(parser, function (error, value, parser) {
        parser.onStartElementNS(handleStartElement)
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
      var param = null
      parser.onCharacters(function(chars) {
        switch (element) {
          case 'boolean':
            param = chars == '1' ? true : false
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
        // Override these listeners:
        // onCharacters prevents reading non-value whitespace
        // onStartElementNS makes sure this function will listen to new
        // elements, as opposed to a parent function
        parser.onCharacters(function () {})
        parser.onStartElementNS(handleStartElement)
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
        // Override these listeners:
        // onCharacters prevents reading non-value whitespace
        // onStartElementNS makes sure this function will listen to new
        // elements, as opposed to a parent function
        parser.onCharacters(function () {})
        parser.onStartElementNS(handleStartElement)
        struct[name] = value

        // If hits the end of this struct XML, return the object 
        parser.onEndElementNS(function(element, prefix, uri) {
          if (element === 'struct') {
            callback(null, struct)
          }
        })

      })
    }
  }
}

