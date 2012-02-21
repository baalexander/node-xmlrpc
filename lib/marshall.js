var xmlBuilder    = require('xmlbuilder')
  , dateFormatter = require('./date-formatter')

/**
 * Creates the XML for an XML-RPC method call.
 *
 * @param {String} method     - The method name.
 * @param {Array} params      - Params to pass in the call.
 * @param {Function} callback - function (error, xml) { ... }
 *   - {Object|null} error    - Any errors that occurred while building the XML,
 *                              otherwise null.
 *   - {String} xml           - The method call XML.
 */
exports.marshallCall = function(method, params) {
  var xml = xmlBuilder.create()
    . begin('methodCall', { version: '1.0' })
    . ele('methodName')
      . txt(method)
    . up()
    . ele('params')
    ;

  (params || []).forEach(function(p) { marshallValue(p, xml.ele('param')) })

  // Includes the <?xml ...> declaration
  return xml.doc().toString()
}

/**
 * Creates the XML for an XML-RPC method response.
 *
 * @param {mixed} value       - The value to pass in the response.
 * @param {Function} callback - function (error, xml) { ... }
 *   - {Object|null} error    - Any errors that occurred while building the XML,
 *                              otherwise null.
 *   - {String} xml           - The method response XML.
 */
exports.marshallResponse = function(result) {
  var xml = xmlBuilder.create()
    . begin('methodResponse', { version: '1.0' })
    . ele('params')
      . ele('param')

  marshallValue(result, xml)

  // Includes the <?xml ...> declaration
  return xml.doc().toString()
}

exports.marshallFault = function(fault) {
  var xml = xmlBuilder.create()
    . begin('methodResponse', { version: '1.0' })
    . ele('fault')

  marshallValue(fault, xml)

  // Includes the <?xml ...> declaration
  return xml.doc().toString()
}

function marshallValue(value, xml) {
  var stack = [ { value: value, xml: xml } ]
    , current
    , value_node
    , next
  while (stack.length > 0) {
    current = stack[stack.length - 1]

    if (current.idx !== undefined) {
      // we're iterating a compound
      next = get_next(current, current.xml);
      if (next) {
        stack.push(next)
      } else {
        stack.pop();
      }
    } else {
      // we're about to add a new value (compound or simple)
      value_node = current.xml.ele('value')
      switch(typeof current.value) {
        case 'boolean':
          append_boolean(current.value, value_node)
          stack.pop()
          break
        case 'string':
          append_string(current.value, value_node)
          stack.pop()
          break
        case 'number':
          append_number(current.value, value_node)
          stack.pop()
          break
        case 'object':
          if (current.value === null) {
            value_node.ele('nil')
            stack.pop()
          } else if (current.value instanceof Date) {
            append_datetime(current.value, value_node)
            stack.pop()
          } else if (Buffer.isBuffer(current.value)) {
            append_buffer(current.value, value_node)
            stack.pop()
          } else {
            if (Array.isArray(current.value)) {
              current.xml = value_node.ele('array').ele('data')
            } else {
              current.xml = value_node.ele('struct')
              current.keys = Object.keys(current.value)
            }
            current.idx = 0
            next = get_next(current, current.xml);
            if (next) {
              stack.push(next)
            } else {
              stack.pop();
            }
          }
          break
      }
    }
  }
}

function get_next(frame, node) {
  if (frame.keys) {
    if (frame.idx < frame.keys.length) {
      // XXX a little obscure ...
      var key = frame.keys[frame.idx++]
        , member = node.ele('member').ele('name').text(key).up()
      return { value: frame.value[key], xml: member }
    }
  } else if (frame.idx < frame.value.length) {
    return { value: frame.value[frame.idx++], xml: node }
  }
}

function append_boolean(value, xml) { xml.ele('boolean').txt(value ? 1 : 0) }

var illegal_chars = /^(?![^<&]*]]>[^<&]*)[^<&]*$/

function append_string(value, xml) {
  if (value.length === 0) {
    xml.ele('string')
  } else if (!illegal_chars.test(value)) {
    xml.ele('string').d(value)
  } else {
    xml.ele('string').txt(value)
  }
}

function append_number(value, xml) {
  // Since there is no isInt() or isFloat() in JavaScript, we're wild-guessing
  // based on the remainder. So a param might change its type just because it
  // has a different value. Not good.
  xml.ele(value % 1 == 0 ? 'int' : 'double').txt(value)
}

function append_datetime(value, xml) {
  xml.ele('dateTime.iso8601').txt(dateFormatter.encodeIso8601(value))
}

function append_buffer(value, xml) {
  xml.ele('base64').txt(value.toString('base64'))
}
