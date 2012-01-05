var sax           = require('sax')
  , dateFormatter = require('./date-formatter.js')

var xmlrpcParser = exports

var parser              = createParser()
  , startMethodCall     = false
  , startMethodResponse = false
  , charStream          = ''

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

  parser.onopentag = function(node) {
    // Only parse the methodResponse
    if (node.name === 'METHODCALL') {
      startMethodCall = true
      // Parses the method name
      deserializeMethod(function(error, method) {
        // Ignores whitespace encountered before params
        resetListeners(function() {})

        // Parses the params
        deserializeParams(function (error, params) {
          callback(error, method, params)
        })
      })
    }
  }

  // If the end of the document was reached and the methodCall tag was never
  // encountered, then the XML is an invalid XML-RPC method call.
  parser.onend = function() {
    if (!startMethodCall) {
      var error = new Error('Invalid method call.')
      callback(error)
    }
  }

  parser.onerror = function(error) {
    callback(error)
  }

  parser.write(xml)
}

/**
 * Parses an XML-RPC method response.
 *
 * @param {String} xml        - The XML string to parse.
 * @param {Function} callback - function (error, value) { ... }
 *   - {Object|null} error    - Any errors that occurred while parsing,
 *                              otherwise null.
 *   - {Object} value         - Value returned in the method response
 */
xmlrpcParser.parseMethodResponse = function(xml, callback) {

  parser.onopentag = function(node) {
    // Only parse the methodResponse
    if (node.name === 'METHODRESPONSE') {
      startMethodResponse = true
      deserializeParams(function (fault, params) {

        // There should be only one param returned from a methodResponse
        var value = null
        if (params !== undefined
          && params !== null
          && Array.isArray(params)
          && params.length > 0) {
          value = params[0]
        }

        // Ensure that the error that was passed is an Error instance.
        var error = null
        if (fault !== null) {
          error = new Error(fault.faultString)
          error.code = error.faultCode = fault.faultCode
          error.faultString = fault.faultString
        }

        callback(error, value)
      })
    }
  }

  parser.onend = function() {
    // If the end of the document was reached and the methodResponse tag was
    // never encountered, then the XML is an invalid XML-RPC method response.
    if (!startMethodResponse) {
      var error = new Error('Invalid method response.')
      callback(error)
    }
  }

  parser.onerror = function(error) {
    callback(error)
  }

  parser.write(xml)
}

/**
 * Passes more XML chunks to parse.
 *
 * @param {String} xml - The XML string to parse.
 */
xmlrpcParser.write = function(xml) {
  parser.write(xml)
}

/**
 * Let's the parser know it has received all the XML. This must be called.
 */
xmlrpcParser.close = function() {
  parser.close()
  parser = createParser()
}

function createParser() {
  startMethodCall = false
  startMethodResponse = false
  return sax.parser()
}

function resetListeners(startElementListener) {
  // Removes listeners to prevent them from being fired on parsing events when
  // they should be ignored.

  // Make sure the right new element handler is listening
  parser.onopentag = startElementListener

  // Ignore whitespace in between tags
  parser.ontext = function(chars) { }

  // Ignore close tag events
  parser.onclosetag = function(element) { }
}

function deserializeMethod(callback) {
  parser.onopentag = function(node) {
    if (node.name === 'METHODNAME') {
      parser.ontext = function(chars) {
        charStream += chars
      }

      parser.onclosetag = function(element) {
        var methodName = charStream;
        charStream = ''
        callback(null, methodName)
      }
    }
  }
}

function deserializeParams(callback) {
  var fault  = null
    , params = []

  // Returns either a fault object or an array of params when finished parsing
  parser.onend = function() {
    if (fault !== null) {
      callback(fault, null)
    }
    else {
      callback(null, params)
    }
  }

  var handleStartElement = function(node) {
    // Parses each param in the message
    if (node.name === 'PARAM') {
      deserializeParam(function (error, param) {
        // Ignores whitespacing and sets correct new element listener
        resetListeners(handleStartElement)
        params.push(param)
      })
    }
    // If the message response is a fault, parse the error
    else if (node.name === 'FAULT') {
      fault = {}
      deserializeParam(function (error, value) {
        resetListeners(handleStartElement)
        fault = value
      })
    }
  }

  resetListeners(handleStartElement)
}

function deserializeParam(callback) {

  parser.onopentag = function(node) {
    // Checks if element is an XML-RPC data type
    var flatParams  = ['BOOLEAN', 'DATETIME.ISO8601', 'DOUBLE', 'INT', 'I4', 'I8', 'STRING', 'NIL', 'BASE64']
      , isFlatParam = ~flatParams.indexOf(node.name);

    // A non-nested parameter. These simple values can be returned immediately.
    if (isFlatParam) {
      parser.ontext = function(chars) {
        // Stream the additional data to the text stream
        charStream += chars
      }

      parser.onclosetag = function(element) {
        var text = charStream
        charStream = ''

        // Parses the XML string into the appropriate JavaScript value
        var param = null
        switch (element) {
          case 'BOOLEAN':
            if (text === '1') {
              param = true
            }
            else {
              param = false
            }
            break
          case 'DATETIME.ISO8601':
            param = dateFormatter.decodeIso8601(text)
            break
          case 'DOUBLE':
            param = parseFloat(text)
            break
          case 'I8':
            param = parseFloat(text)
            break
          case 'I4':
            param = parseInt(text)
            break
          case 'INT':
            param = parseInt(text)
            break
          case 'STRING':
            param = text
            break
          case 'BASE64':
            param = new Buffer(text, 'base64')
            break
        }

        callback(null, param)
      }
    }
    // An Array must handle multiple values and possibly nested values too
    else if (node.name === 'ARRAY') {
      deserializeArrayParam(function (error, param) {
        callback(null, param)
      })
    }
    // A Struct must handle multiple values and possibly nested values too
    else if (node.name === 'STRUCT') {
      deserializeStructParam(function (error, param) {
        callback(null, param)
      })
    }
    // Probably a <value> without type, like: <value>string</value>
    else {
      // Reset the charstream to prevent whitespace being added to
      // value-elements without an explicit type.
      charStream =''
      parser.ontext = function(chars) {
        // Stream the additional data to the text stream
        charStream += chars
      }

      parser.onclosetag = function(element) {
        var param = charStream
        charStream = ''
        callback(null, param);
      }
    }
  }
  
  // The above else code is duplicated here. This is necessary
  // because it is possible to arive here either from a <PARAM>
  // tag or directly from a <VALUE> tag. The latter happens with
  // <ARRAY> and <STRUCT>.
  charStream =''
  parser.ontext = function(chars) {
    charStream += chars
  }

  parser.onclosetag = function(element) {
    var param = charStream
    charStream = ''
    callback(null, param);
  }

}

function deserializeArrayParam(callback) {
  var values = []

  var checkForArray = function(element) {
    if (element === 'ARRAY') {
      callback(null, values)
    }
  }

  var handleStartElement = function(node) {
    // <array>s have a single mandatory <data> tag inside of them. If this is
    // the <data> tag, then set a listener checking for </array>
    if (node.name === 'DATA') {
      parser.onclosetag = checkForArray
    }
    // Parse each element in the array XML (denoted by element 'value') and adds
    // to the array
    else if (node.name === 'VALUE') {
      deserializeParam(function(error, value) {
        // Ignores whitespacing and sets correct new element listener
        resetListeners(handleStartElement)
        values.push(value)

        // If hits the end of this array XML, return the values
        parser.onclosetag = checkForArray
      })
    }
  }

  parser.onopentag = handleStartElement
}

function deserializeStructParam(callback) {
  var struct = {}
    , name = null

  var handleStartElement = function(node) {
    // Parse each member in the struct XML (denoted by element 'member') and
    // adds to the object
    if (node.name === 'NAME') {
      parser.ontext = function(chars) {
        name = chars
      }
      parser.onclosetag = function(element) {
        resetListeners(handleStartElement)
      }
    }
    if (node.name === 'VALUE') {
      deserializeParam(function(error, value) {
        // Ignores whitespacing and sets correct new element listener
        resetListeners(handleStartElement)

        // If hits the end of this struct XML, return the object
        struct[name] = value
        parser.onclosetag = function(element) {
          if (element === 'STRUCT') {
            callback(null, struct)
          }
        }
      })
    }
  }

  parser.onopentag = handleStartElement
}

