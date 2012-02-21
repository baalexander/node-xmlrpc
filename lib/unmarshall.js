var sax    = require('sax')
  , invoke = require('./utilities').invoke
  

function create_fault(fault) {
  var e = new Error('xmlrpc fault' + (fault.faultString ? ': ' + fault.faultString : ''))
  e.code = fault.faultCode
  e.faultCode = fault.faultCode
  e.faultString = fault.faultString
  return e
}

exports.unmarshallResponse = function unmarshallResponse(stream, cb) {
  var u;
  function on_result(error, result) {
    if ( ! error ) {
      if (result.length > 1) {
        cb(new Error('xmlrcp: response has more than one param'))
        return
      }
      if (u._type !== 'methodresponse') {
        cb(new Error('xmlrpc: not a method response'))
        return
      }
      if ( ! u._responseType) {
        cb(new Error('xmlrpc: inavlid method response'))
        return
      }
    }
    // The unmarshaller always returns an array. In case of a 
    // method response we only return the first item.
    cb(error, error ? undefined : result ? result[0] : undefined)
  }
  u = new Unmarshaller(stream, on_result);
}

var Unmarshaller = function Unmarshaller(stream, cb) {
  this._type = null
  this._responseType = null
  this._stack = []
  this._marks = []
  this._data = []
  this._methodname = null
  this._encoding = 'utf8'
  this._value = false
  this._callback = cb
  this._error = null
  
  this._parser = sax.createStream()
  this._parser.on('opentag',  invoke(this, 'opentag'))
  this._parser.on('closetag', invoke(this, 'closetag'))
  this._parser.on('text',     invoke(this, 'text'))
  this._parser.on('end',      invoke(this, 'done'))
  this._parser.on('error',    invoke(this, 'error'))

  stream.setEncoding('utf8')
  stream.on('error', invoke(this, 'error'))
  stream.pipe(this._parser);
}

Unmarshaller.prototype =
{ _type: null
, _responseType: null
, _stack: []
, _marks: []
, _data: []
, _methodname: null
, _encoding: null
, _parser: null
, _value: false
, _error: null
}

Unmarshaller.prototype.done = function done() {
  if (this._error) {
    return;
  }
  if (this._type === null || this._marks.length) {
    this._callback(new Error('xmlrpc: invalid xmlrpc message'))
    return
  }
  if (this._responseType === 'fault') {
    this._callback(create_fault(this._stack[0]))
    return
  }
  this._callback(undefined, this._stack)
}

Unmarshaller.prototype.error = function error(msg) {
  if (this._error) return
  // TODO: tear down IO and stop parsing?
  this._error = typeof msg === 'string' ? new Error(msg) : msg
  this._callback(this._error);
}

Unmarshaller.prototype.push = function push(value) {
  this._stack.push(value)
}

//==============================================================================
// SAX Handlers
//==============================================================================

Unmarshaller.prototype.opentag = function opentag(n) {
  if (n.name === 'ARRAY' || n.name === 'STRUCT') {
    this._marks.push(this._stack.length)
  }
  this._data = []
  this._value = (n.name === 'VALUE')
}

Unmarshaller.prototype.text = function text(t) {
  this._data.push(t)
}

Unmarshaller.prototype.closetag = function closetag(e) {
  var data = this._data.join('')
  try {
    switch(e) {
      case 'BOOLEAN':
        this.end_boolean(data); break
      case 'INT':
      case 'I4':
        this.end_int(data); break
      case 'DOUBLE':
        this.end_double(data); break
      case 'STRING':
      case 'NAME':
        this.end_string(data); break
      case 'ARRAY':
        this.end_array(data); break
      case 'STRUCT':
        this.end_struct(data); break
      case 'BASE64':
        this.end_base64(data); break
      case 'DATETIME.ISO8601':
        this.end_date_time(data); break
      case 'VALUE':
        this.end_value(data); break
      case 'PARAMS':
        this.end_params(data); break
      case 'FAULT':
        this.end_fault(data); break
      case 'METHODRESPONSE':
        this.end_method_response(data); break
      case 'DATA':
      case 'PARAM':
      case 'MEMBER':
        break /* ignored by design */

      // non standard types
      case 'I8':
        this.end_i8(data); break
      case 'NIL':
        this.end_nil(data); break

      default:
        this.error("xmlrpc: unknown tag '" + e + "'");
        break
    }
  } catch (ex) {
    this.error(ex);
  }
}

//==============================================================================
// Type Handlers
//==============================================================================

Unmarshaller.prototype.end_nil = function end_nil(data) {
  this.push(null)
  this._value = false
}

Unmarshaller.prototype.end_boolean = function end_boolean(data) {
  if (data === '1') {
    this.push(true)
  } else if (data === '0') {
    this.push(false)
  } else {
    this.error("xmlrpc: illegal boolean value '" + data + "'")
  }
  this._value = false
}

Unmarshaller.prototype.end_int = function end_int(data) {
  var v = parseInt(data, 10)
  if (isNaN(v)) {
    throw new Error("xmlrpc: expected an integer but got '" + data + "'");
  }
  this.push(v)
  this._value = false
}

Unmarshaller.prototype.end_double = function end_double(data) {
  var v = parseFloat(data)
  if (isNaN(v)) {
    throw new Error("xmlrpc: expected a double but got '" + data + "'");
  }
  this.push(v)
  this._value = false
}

Unmarshaller.prototype.end_string = function end_string(data) {
  this.push(data)
  this._value = false
}

Unmarshaller.prototype.end_array = function end_array(data) {
  var mark = this._marks.pop()
  this._stack.splice(mark, this._stack.length - mark, this._stack.slice(mark))
  this._value = false
}

Unmarshaller.prototype.end_struct = function end_struct(data) {
  var mark = this._marks.pop()
    , struct = {}
    , items = this._stack.slice(mark)
    , i = 0
    
  for (; i < items.length; i += 2) {
    struct[items[i]] = items[i + 1]
  }
  this._stack.splice(mark, this._stack.length - mark, struct)
  this._value = false
}

Unmarshaller.prototype.end_base64 = function end_base64(data) {
  this.push(new Buffer(data, 'base64'))
  this._value = false
}

Unmarshaller.prototype.end_date_time = function end_date_time(data) {
  this.push(parseISO8601(data))
  this._value = false
}

var is_integer = /^-?\d+$/
Unmarshaller.prototype.end_i8 = function end_i8(data) {
  if ( ! is_integer.test(data)) {
    throw new Error("xmlrpc: expected integer (I8) value but got '" + data + "'")
  }
  this.end_string(data)
}

Unmarshaller.prototype.end_value = function end_value(data) {
  if (this._value) {
    this.end_string(data)
  }
}

Unmarshaller.prototype.end_params = function end_params(data) {
  this._responseType = 'params'
}

Unmarshaller.prototype.end_fault = function end_fault(data) {
  this._responseType = 'fault'
}

Unmarshaller.prototype.end_method_response = function end_method_response(data) {
  this._type = 'methodresponse'
}

function parse_xml_pi(n) { 
  // XXX sloppy
  if (n.name === 'xml') {
    var attrs = n.body.split(' ')
      , attributes = {}
      , i
    for (i = 0; i < attrs.length; ++i) {
      var tokens = attrs[i].split('=')
      attributes[tokens[0]] = tokens[1].substr(1, tokens[1].length - 2)
    }
    n.attributes = attributes
    return n
  }
  return
}

// http://my.safaribooksonline.com/book/programming/regular-expressions/9780596802837/validation-and-formatting/validate_iso_8601_dates_and_times#X2ludGVybmFsX0ZsYXNoUmVhZGVyP3htbGlkPTk3ODA1OTY4MDI4MzcvMjM5
// with modifications: ignore dashes 
var iso_8601_re = /^(-?(?:[1-9][0-9]*)?[0-9]{4})-?(1[0-2]|0[1-9])-?(3[0-1]|0[1-9]|[1-2][0-9])T(2[0-3]|[0-1][0-9]):([0-5][0-9]):([0-5][0-9])(\.[0-9]+)?(Z|[+-](?:2[0-3]|[0-1][0-9]):[0-5][0-9])?$/
function parseISO8601(str) {
  var m = str.match(iso_8601_re)

  if ( ! m ) {
    throw new Error("xmlrpc: expected a ISO8601 datetime but got '" + str + "'")
  }
  var date = new Date(m[1], 0, 1)
  
  if (m[2]) { date.setMonth(m[2] - 1) }
  if (m[3]) { date.setDate(m[3]) }
  if (m[4]) { date.setHours(m[4]) }
  if (m[5]) { date.setMinutes(m[5]) }
  if (m[6]) { date.setSeconds(m[6]) }
  if (m[7]) { date.setMilliseconds(m[7]) }
  // TODO timezone m[8] && date.XXX(m[8]) }
  return date;
}
  
