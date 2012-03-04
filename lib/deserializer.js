var sax           = require('sax')
  , decodeIso8601 = require('./date-formatter').decodeIso8601

var Deserializer = function() {
  this._type = null
  this._responseType = null
  this._stack = []
  this._marks = []
  this._data = []
  this._methodname = null
  this._encoding = 'utf8'
  this._value = false
  this._callback = null
  this._error = null

  this._parser = sax.createStream()
  this._parser.on('opentag',  invoke(this, 'opentag'))
  this._parser.on('closetag', invoke(this, 'closetag'))
  this._parser.on('text',     invoke(this, 'text'))
  this._parser.on('end',      invoke(this, 'done'))
  this._parser.on('error',    invoke(this, 'error'))
}

Deserializer.prototype.deserializeMethodResponse = function(stream, callback) {
  var that = this

  this._callback = function(error, result) {
    if (!error) {
      if (result.length > 1) {
        callback(new Error('xmlrcp: response has more than one param'))
        return
      }
      if (that._type !== 'methodresponse') {
        callback(new Error('xmlrpc: not a method response'))
        return
      }
      if (!that._responseType) {
        callback(new Error('xmlrpc: inavlid method response'))
        return
      }
    }
    // The unmarshaller always returns an array. In case of a 
    // method response we only return the first item.
    callback(error, error ? undefined : result ? result[0] : undefined)
  }

  stream.setEncoding('utf8')
  stream.on('error', invoke(this, 'error'))
  stream.pipe(this._parser);
}

Deserializer.prototype.deserializeMethodCall = function(stream, callback) {
  var that = this

  this._callback = function(error, result) {
    if (!error ) {
      if (that._type !== 'methodcall') {
        callback(new Error('xmlrpc: not a method call'))
        return
      }
      if (!that._methodname) {
        callback(new Error('xmlrpc: method call did not contain a method name'))
        return
      }
    }
    callback(error, that._methodname, result)
  }

  stream.setEncoding('utf8')
  stream.on('error', invoke(this, 'error'))
  stream.pipe(this._parser);
}

Deserializer.prototype.done = function done() {
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

// TODO:
// Error handling needs a little thinking. There are two different kinds of
// errors: 
//   1. Low level errors like network, stream or xml errors. These don't
//      require special treatment. They only need to be forwarded. The IO
//      is already stopped in these cases. 
//   2. Protocol errors: Invalid tags, invalid values &c. These happen in
//      our code and we should tear down the IO and stop parsing.
// Currently all errors end here. Guess I'll split it up. 
Deserializer.prototype.error = function error(msg) {
  if (this._error) return
  this._error = typeof msg === 'string' ? new Error(msg) : msg
  this._callback(this._error);
}

Deserializer.prototype.push = function push(value) {
  this._stack.push(value)
}

//==============================================================================
// SAX Handlers
//==============================================================================

Deserializer.prototype.opentag = function opentag(n) {
  if (n.name === 'ARRAY' || n.name === 'STRUCT') {
    this._marks.push(this._stack.length)
  }
  this._data = []
  this._value = (n.name === 'VALUE')
}

Deserializer.prototype.text = function text(t) {
  this._data.push(t)
}

Deserializer.prototype.closetag = function closetag(e) {
  var data = this._data.join('')
  try {
    switch(e) {
      case 'BOOLEAN':
        this.end_boolean(data);         break
      case 'INT':
      case 'I4':
        this.end_int(data);             break
      case 'DOUBLE':
        this.end_double(data);          break
      case 'STRING':
      case 'NAME':
        this.end_string(data);          break
      case 'ARRAY':
        this.end_array(data);           break
      case 'STRUCT':
        this.end_struct(data);          break
      case 'BASE64':
        this.end_base64(data);          break
      case 'DATETIME.ISO8601':
        this.end_date_time(data);       break
      case 'VALUE':
        this.end_value(data);           break
      case 'PARAMS':
        this.end_params(data);          break
      case 'FAULT':
        this.end_fault(data);           break
      case 'METHODRESPONSE':
        this.end_method_response(data); break
      case 'METHODNAME':
        this.end_method_name(data);     break
      case 'METHODCALL':
        this.end_method_call(data);     break
      case 'DATA':
      case 'PARAM':
      case 'MEMBER':
        /* ignored by design */         break

      // non standard types
      case 'I8':
        this.end_i8(data);              break
      case 'NIL':
        this.end_nil(data);             break

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

Deserializer.prototype.end_nil = function(data) {
  this.push(null)
  this._value = false
}

Deserializer.prototype.end_boolean = function(data) {
  if (data === '1') {
    this.push(true)
  } else if (data === '0') {
    this.push(false)
  } else {
    throw new Error("xmlrpc: illegal boolean value '" + data + "'")
  }
  this._value = false
}

Deserializer.prototype.end_int = function(data) {
  var v = parseInt(data, 10)
  if (isNaN(v)) {
    throw new Error("xmlrpc: expected an integer but got '" + data + "'")
  }
  this.push(v)
  this._value = false
}

Deserializer.prototype.end_double = function(data) {
  var v = parseFloat(data)
  if (isNaN(v)) {
    throw new Error("xmlrpc: expected a double but got '" + data + "'")
  }
  this.push(v)
  this._value = false
}

Deserializer.prototype.end_string = function(data) {
  this.push(data)
  this._value = false
}

Deserializer.prototype.end_array = function(data) {
  var mark = this._marks.pop()
  this._stack.splice(mark, this._stack.length - mark, this._stack.slice(mark))
  this._value = false
}

Deserializer.prototype.end_struct = function(data) {
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

Deserializer.prototype.end_base64 = function(data) {
  this.push(new Buffer(data, 'base64'))
  this._value = false
}

Deserializer.prototype.end_date_time = function(data) {
  this.push(decodeIso8601(data))
  this._value = false
}

var is_integer = /^-?\d+$/
Deserializer.prototype.end_i8 = function(data) {
  if ( ! is_integer.test(data)) {
    throw new Error("xmlrpc: expected integer (I8) value but got '" + data + "'")
  }
  this.end_string(data)
}

Deserializer.prototype.end_value = function(data) {
  if (this._value) {
    this.end_string(data)
  }
}

Deserializer.prototype.end_params = function(data) {
  this._responseType = 'params'
}

Deserializer.prototype.end_fault = function(data) {
  this._responseType = 'fault'
}

Deserializer.prototype.end_method_response = function(data) {
  this._type = 'methodresponse'
}

Deserializer.prototype.end_method_name = function(data) {
  this._methodname = data
}

Deserializer.prototype.end_method_call = function(data) {
  this._type = 'methodcall'
}

//==============================================================================
// Utilities
//==============================================================================

function create_fault(fault) {
  var e = new Error('xmlrpc fault' + (fault.faultString ? ': ' + fault.faultString : ''))
  e.code = fault.faultCode
  e.faultCode = fault.faultCode
  e.faultString = fault.faultString
  return e
}

function invoke(obj, method) {
  var f = typeof method === 'function' ? f : obj[method]
  return function() { f.apply(obj, arguments) }
}

module.exports = Deserializer

