// Node v0.4 does not support hex encoding with buffers.
// This adds the hex to buffer functionality.
// Originally contributed by @agnat
// https://gist.github.com/2009443/7455b3eccff0b51294adf07c1cfa6051490fabd7

var zero = '0'.charCodeAt(0)
  , nine = '9'.charCodeAt(0)
  , a_code = 'a'.charCodeAt(0)
  , z_code = 'z'.charCodeAt(0)
  , A_code = 'A'.charCodeAt(0)
  , Z_code = 'Z'.charCodeAt(0)

function nibble(code) {
  if (zero <= code && code <= nine) {
    return code - zero
  } else if (a_code <= code && code <= z_code) {
    return (10 + code) - a_code
  } else if (A_code <= code && code <= Z_code) {
    return (10 + code) - A_code
  } else {
    throw new Error('invalid character in hex string')
  }
}

exports.hexToBuffer = function(str) {
  if (str.length % 2 !== 0) throw new Error('string has odd length')
  var buffer = new Buffer(str.length / 2)
    , i, b
  for (i = 0; i < buffer.length; ++i) {
    buffer[i] =
        (nibble(str.charCodeAt(2 * i)) << 4)
      | nibble(str.charCodeAt(2 * i + 1))
  }
  return buffer
}

