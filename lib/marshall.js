var xmlBuilder    = require('xmlbuilder')
  , dateFormatter = require('./date-formatter.js')

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

  // Creates the boiler plate for the XML-RPC call
  var xml = xmlBuilder.create()
    .begin('methodCall', { version: '1.0' })
    .ele('methodName')
      .txt(method)
    .up()

  // Adds each parameter to the XML-RPC call
  params = params || []
  var paramsXml = xml.ele('params')
  params.forEach(function(p) { marshallParam(p, paramsXml.ele('param')) })

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
exports.marshallResponse = function(value) {
  // Creates the boiler plate for the XML-RPC response
  var xml = xmlBuilder.create()
    .begin('methodResponse', { version: '1.0' })

  // Adds the parameter to the XML-RPC call
  var paramXml = xml.ele('params')
    .ele('param')
  marshallParam(value, paramXml)

  // Includes the <?xml ...> declaration
  return xml.doc().toString()
}

exports.marshallFault = function(fault) {
  // Creates the boiler plate for the XML-RPC response
  var xml = xmlBuilder.create()
    .begin('methodResponse', { version: '1.0' })

  // Adds the fault to the XML-RPC call
  var faultXml = xml.ele('fault')
  marshallParam(fault, faultXml)

  // Includes the <?xml ...> declaration
  return xml.doc().toString()
}

function marshallParam(params, xml) {
  var stack = [{param: params, xml: xml}]
    , current
    , value_node
    , next
  while (stack.length > 0) {
    current = stack[stack.length - 1]


    if (current.idx !== undefined) {
      next = get_next(current, current.xml);
      if (next) {
        stack.push(next)
      } else {
        stack.pop();
      }
    } else {
      value_node = current.xml.ele('value')
      switch(typeof current.param) {
        case 'boolean':
          append_boolean(current.param, value_node)
          stack.pop()
          break
        case 'string':
          append_string(current.param, value_node)
          stack.pop()
          break
        case 'number':
          append_number(current.param, value_node)
          stack.pop()
          break
        case 'object':
          if (current.param === null) {
            value_node.ele('nil')
            stack.pop()
          } else if (current.param instanceof Date) {
            append_datetime(current.param, value_node)
            stack.pop()
          } else if (Buffer.isBuffer(current.param)) {
            append_buffer(current.param, value_node)
          } else {
            if (Array.isArray(current.param)) {
              current.xml = value_node.ele('array').ele('data')
            } else {
              current.xml = value_node.ele('struct')
              current.keys = Object.keys(current.param)
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
        , member = node.ele('member')
      member.ele('name').text(key)
      return {param: frame.param[key], xml: member}
    }
  } else if (frame.idx < frame.param.length) {
    return {param: frame.param[frame.idx++], xml: node}
  }
}

function append_boolean(value, xml) { xml.ele('boolean').txt(value ? 1 : 0) }

var illegal_chars = /^(?![^<&]*]]>[^<&]*)[^<&]*$/

function append_string(value, xml) {
  // If the string contains illegal characters, use CDATA
  if (!value.match(illegal_chars)) {
    xml.ele('string').d(param)
  }
  // Force the empty element (<string/>)
  else if (value.length === 0) {
    xml.ele('string')
  }
  else {
    xml.ele('string').txt(value)
  }
}

function append_number(value, xml) {
  // Since no is_int or is_float in JavaScript, determines based on if a
  // remainder
  // JavaScript just sucks at numerics ... big time [agnat]
  if (value % 1 == 0) {
    xml.ele('int')
      .txt(value)
  }
  else {
    xml.ele('double')
      .txt(value)
  }
}

function append_datetime(value, xml) {
  xml.ele('dateTime.iso8601')
    .txt(dateFormatter.encodeIso8601(value))
}

function append_buffer(value, xml) {
  value_node.ele('base64')
    .txt(param.toString('base64'))
}
