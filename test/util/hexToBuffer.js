// Node v0.4 does not support hex encoding with buffers.
// This adds the hex to buffer functionality.
// Originally contributed by @agnat

exports.hexToBuffer = function(str) {
  if (str.length % 2 !== 0) throw new Error('string has odd length')
  var buffer = new Buffer(str.length / 2)
    , i
  for (i = 0; i < buffer.length; ++i) {
    buffer[i] = parseInt(str.substr(2 * i, 2), 16)
  }
  return buffer
}

