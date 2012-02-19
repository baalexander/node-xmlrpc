var sax = require('sax');

function createFault(fault) {
  var e = new Error('XML RPC Fault: ' + fault.faultString);
  e.code = fault.faultCode;
  e.faultCode = fault.faultCode;
  e.faultString = fault.faultString;
  return e;
}

var Unmarshaller = exports.Unmarshaller = function Unmarshaller(cb) {
  var self = this;
  self._responseType = null;
  self._stack = [];
  self._marks = [];
  self._data = [];
  self._methodname = null;
  self._encoding = 'utf8';
  self._parser = sax.parser();
  self._value = false;
  
  self._parser.onopentag = function() { self.start.apply(self, arguments) }
  self._parser.onclosetag = function() { self.end.apply(self, arguments) }
  self._parser.ontext = function() { self.text.apply(self, arguments) }
  self._callback = cb;
}

Unmarshaller.prototype =
{ _responseType: null
, _stack: []
, _marks: []
, _data: []
, _methodname: null
, _encoding: null
, _parser: null
, _value: false
, dispatch: { /* filled below */ }
}

Unmarshaller.prototype.close = function() {
  this._parser.close();
  if (this._responseType === null || this._marks.length) {
    this._callback(new Error('xmlrpc response error')); return;
  }
  if (this._responseType === 'fault') {
    this._callback(createFault(this._stack[0])); return;
  }
  this._callback(undefined, this._stack);
}

Unmarshaller.prototype.write = function write(chunk) {
  this._parser.write(chunk)
}

Unmarshaller.prototype.push = function push(value) {
  this._stack.push(value)
}

Unmarshaller.prototype.start = function start(n) {
  if (n.name === 'ARRAY' || n.name === 'STRUCT') {
    this._marks.push(this._stack.length);
  }
  this._data = [];
  this._value = (n.name === 'VALUE');
}

Unmarshaller.prototype.text = function text(t) {
  this._data.push(t);
}

Unmarshaller.prototype.end = function end(e) {
  if (this.dispatch[e]) {
    this.dispatch[e].call(this, this._data.join(''))
  } else {
    switch(e) {
      case 'DATA':
      case 'PARAM':
      case 'MEMBER':
      case 'METHODRESPONSE':
        break;
      default:
        console.log('TODO: unhandled tag:', e);
        break;
    }
  }
}

Unmarshaller.prototype.end_nil = function end_nil(data) {
  this.append(null);
  this._value = false;
}
Unmarshaller.prototype.dispatch.NIL = Unmarshaller.prototype.end_nil;

Unmarshaller.prototype.end_boolean = function end_boolean(data) {
  if (data === '1') {
    this.push(true);
  } else if (data === '0') {
    this.push(false);
  } else {
    console.log('bad boolean value', e);
  }
  this._value = false;
}
Unmarshaller.prototype.dispatch.BOOLEAN = Unmarshaller.prototype.end_boolean;

Unmarshaller.prototype.end_int = function end_int(data) {
  this.push(parseInt(data))
  this._value = false;
}
Unmarshaller.prototype.dispatch.I4 = Unmarshaller.prototype.end_int;
Unmarshaller.prototype.dispatch.INT = Unmarshaller.prototype.end_int;
// XXX TODO i8 

Unmarshaller.prototype.end_double = function end_double(data) {
  this.push(parseFloat(data))
  this._value = false;
}
Unmarshaller.prototype.dispatch.DOUBLE = Unmarshaller.prototype.end_double;

Unmarshaller.prototype.end_string = function end_string(data) {
  this.push(data)
  this._value = false;
}
Unmarshaller.prototype.dispatch.STRING = Unmarshaller.prototype.end_string;
Unmarshaller.prototype.dispatch.NAME = Unmarshaller.prototype.end_string;

Unmarshaller.prototype.end_array = function end_array(data) {
  var mark = this._marks.pop();
  this._stack.splice(mark, this._stack.length - mark, this._stack.slice(mark));
  this._value = false;
}
Unmarshaller.prototype.dispatch.ARRAY = Unmarshaller.prototype.end_array;

Unmarshaller.prototype.end_struct = function end_struct(data) {
  var mark = this._marks.pop()
    , struct = {}
    , items = this._stack.slice(mark)
    , i = 0
    ;
  for (; i < items.length; i += 2) {
    struct[items[i]] = items[i + 1];
  }
  this._stack.splice(mark, this._stack.length - mark, struct);
  this._value = false;
}
Unmarshaller.prototype.dispatch.STRUCT = Unmarshaller.prototype.end_struct;

Unmarshaller.prototype.end_base64 = function end_base64(data) {
  this.push(new Buffer(data, 'base64'));
  this._value = false;
}
Unmarshaller.prototype.dispatch.BASE64 = Unmarshaller.prototype.end_base64;

Unmarshaller.prototype.end_date_time = function end_date_time(data) {
  this.push(parseISO8601(data));
  this._value = false;
}
Unmarshaller.prototype.dispatch['DATETIME.ISO8601'] = Unmarshaller.prototype.end_date_time;





Unmarshaller.prototype.end_value = function end_value(data) {
  if (this._value) {
    this.end_string(data);
  }
}
Unmarshaller.prototype.dispatch.VALUE = Unmarshaller.prototype.end_value;

Unmarshaller.prototype.end_params = function end_params(data) {
  this._responseType = 'params';
}
Unmarshaller.prototype.dispatch.PARAMS = Unmarshaller.prototype.end_params;

Unmarshaller.prototype.end_fault = function end_fault(data) {
  this._responseType = 'fault';
}
Unmarshaller.prototype.dispatch.FAULT = Unmarshaller.prototype.end_fault;


function parse_xml_pi(n) { 
  // XXX sloppy
  if (n.name === 'xml') {
    var attrs = n.body.split(' ');
    var attributes = {};
    for (var i = 0; i < attrs.length; ++i) {
      var tokens = attrs[i].split('=');
      attributes[tokens[0]] = tokens[1].substr(1, tokens[1].length - 2);
    }
    n.attributes = attributes;
    return n;
  }
  return undefined;
}

// http://my.safaribooksonline.com/book/programming/regular-expressions/9780596802837/validation-and-formatting/validate_iso_8601_dates_and_times#X2ludGVybmFsX0ZsYXNoUmVhZGVyP3htbGlkPTk3ODA1OTY4MDI4MzcvMjM5
var iso_8601_re = /^(-?(?:[1-9][0-9]*)?[0-9]{4})-?(1[0-2]|0[1-9])-?(3[0-1]|0[1-9]|[1-2][0-9])T(2[0-3]|[0-1][0-9]):([0-5][0-9]):([0-5][0-9])(\.[0-9]+)?(Z|[+-](?:2[0-3]|[0-1][0-9]):[0-5][0-9])?$/
function parseISO8601(str) {
  var m = str.match(iso_8601_re)
    , date = new Date(m[1], 0, 1)
    ;
  
  if (m[2]) { date.setMonth(m[2] - 1) }
  if (m[3]) { date.setDate(m[3]) }
  if (m[4]) { date.setHours(m[4]) }
  if (m[5]) { date.setMinutes(m[5]) }
  if (m[6]) { date.setSeconds(m[6]) }
  if (m[7]) { date.setMilliseconds(m[7]) }
  // TODO timezone m[7] && date.setMilliseconds(m[7]) }
  return date;
}
  
