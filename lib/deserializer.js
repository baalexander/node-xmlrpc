var sax           = require('sax')
  , dateFormatter = require('./date_formatter')

var Deserializer = function() {
  this.type = null
  this.responseType = null
  this.stack = []
  this.marks = []
  this.data = []
  this.methodname = null
  this.encoding = 'utf8'
  this.value = false
  this.callback = null
  this.error = null

  this.parser = sax.createStream()
  this.parser.on('opentag',  this.onOpentag.bind(this))
  this.parser.on('closetag', this.onClosetag.bind(this))
  this.parser.on('text',     this.onText.bind(this))
  this.parser.on('end',      this.onDone.bind(this))
  this.parser.on('error',    this.onError.bind(this))
}

Deserializer.prototype.deserializeMethodResponse = function(stream, callback) {
  var that = this

  this.callback = function(error, result) {
    if (!error) {
      if (result.length > 1) {
        callback(new Error('xmlrcp: response has more than one param'))
        return
      }
      if (that.type !== 'methodresponse') {
        callback(new Error('xmlrpc: not a method response'))
        return
      }
      if (!that.responseType) {
        callback(new Error('xmlrpc: inavlid method response'))
        return
      }
    }
    // The unmarshaller always returns an array. In case of a 
    // method response we only return the first item.
    callback(error, error ? undefined : result ? result[0] : undefined)
  }

  stream.setEncoding('utf8')
  stream.on('error', this.onError.bind(this))
  stream.pipe(this.parser);
}

Deserializer.prototype.deserializeMethodCall = function(stream, callback) {
  var that = this

  this.callback = function(error, result) {
    if (!error ) {
      if (that.type !== 'methodcall') {
        callback(new Error('xmlrpc: not a method call'))
        return
      }
      if (!that.methodname) {
        callback(new Error('xmlrpc: method call did not contain a method name'))
        return
      }
    }
    callback(error, that.methodname, result)
  }

  stream.setEncoding('utf8')
  stream.on('error', this.onError.bind(this))
  stream.pipe(this.parser);
}

Deserializer.prototype.onDone = function() {
  if (this.error) {
    return;
  }
  if (this.type === null || this.marks.length) {
    this.callback(new Error('xmlrpc: invalid xmlrpc message'))
    return
  }
  if (this.responseType === 'fault') {
    this.callback(create_fault(this.stack[0]))
    return
  }
  this.callback(undefined, this.stack)
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
Deserializer.prototype.onError = function(msg) {
  if (!this.error) {
    if (typeof msg === 'string') {
      this.error = new Error(msg)
    }
    else {
      this.error = msg
    }
    this.callback(this.error)
  }
}

Deserializer.prototype.push = function(value) {
  this.stack.push(value)
}

//==============================================================================
// SAX Handlers
//==============================================================================

Deserializer.prototype.onOpentag = function(n) {
  if (n.name === 'ARRAY' || n.name === 'STRUCT') {
    this.marks.push(this.stack.length)
  }
  this.data = []
  this.value = (n.name === 'VALUE')
}

Deserializer.prototype.onText = function(t) {
  this.data.push(t)
}

Deserializer.prototype.onClosetag = function(e) {
  var data = this.data.join('')
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
        this.onError("xmlrpc: unknown tag '" + e + "'")
        break
    }
  } catch (ex) {
    this.onError(ex);
  }
}

//==============================================================================
// Type Handlers
//==============================================================================

Deserializer.prototype.end_nil = function(data) {
  this.push(null)
  this.value = false
}

Deserializer.prototype.end_boolean = function(data) {
  if (data === '1') {
    this.push(true)
  } else if (data === '0') {
    this.push(false)
  } else {
    throw new Error("xmlrpc: illegal boolean value '" + data + "'")
  }
  this.value = false
}

Deserializer.prototype.end_int = function(data) {
  var v = parseInt(data, 10)
  if (isNaN(v)) {
    throw new Error("xmlrpc: expected an integer but got '" + data + "'")
  }
  this.push(v)
  this.value = false
}

Deserializer.prototype.end_double = function(data) {
  var v = parseFloat(data)
  if (isNaN(v)) {
    throw new Error("xmlrpc: expected a double but got '" + data + "'")
  }
  this.push(v)
  this.value = false
}

Deserializer.prototype.end_string = function(data) {
  this.push(data)
  this.value = false
}

Deserializer.prototype.end_array = function(data) {
  var mark = this.marks.pop()
  this.stack.splice(mark, this.stack.length - mark, this.stack.slice(mark))
  this.value = false
}

Deserializer.prototype.end_struct = function(data) {
  var mark = this.marks.pop()
    , struct = {}
    , items = this.stack.slice(mark)
    , i = 0

  for (; i < items.length; i += 2) {
    struct[items[i]] = items[i + 1]
  }
  this.stack.splice(mark, this.stack.length - mark, struct)
  this.value = false
}

Deserializer.prototype.end_base64 = function(data) {
  var buffer = new Buffer(data, 'base64')
  this.push(buffer)
  this.value = false
}

Deserializer.prototype.end_date_time = function(data) {
  var date = dateFormatter.decodeIso8601(data)
  this.push(date)
  this.value = false
}

var is_integer = /^-?\d+$/
Deserializer.prototype.end_i8 = function(data) {
  if (!is_integer.test(data)) {
    throw new Error("xmlrpc: expected integer (I8) value but got '" + data + "'")
  }
  this.end_string(data)
}

Deserializer.prototype.end_value = function(data) {
  if (this.value) {
    this.end_string(data)
  }
}

Deserializer.prototype.end_params = function(data) {
  this.responseType = 'params'
}

Deserializer.prototype.end_fault = function(data) {
  this.responseType = 'fault'
}

Deserializer.prototype.end_method_response = function(data) {
  this.type = 'methodresponse'
}

Deserializer.prototype.end_method_name = function(data) {
  this.methodname = data
}

Deserializer.prototype.end_method_call = function(data) {
  this.type = 'methodcall'
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

module.exports = Deserializer

