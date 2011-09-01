var dateFormatter = exports

/*
 * Converts a date time stamp following the ISO8601 format to a JavaScript Date
 * object.
 *
 * @param {String} time - String representation of timestamp.
 * @return {Date}       - Date object from timestamp.
 */
dateFormatter.decodeIso8601 = function(time) {

  var regexp = '([0-9]{4})([-]?([0-9]{2})([-]?([0-9]{2})'
    + '(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?'
    + '(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?'

  var d = time.toString().match(new RegExp(regexp))

  var offset = 0
  var date = new Date(d[1], 0, 1)

  if (d[3]) {
    date.setMonth(d[3] - 1)
  }
  if (d[5]) {
    date.setDate(d[5])
  }
  if (d[7]) {
    date.setHours(d[7])
  }
  if (d[8]) {
    date.setMinutes(d[8])
  }
  if (d[10]) {
    date.setSeconds(d[10])
  }
  if (d[12]) {
    date.setMilliseconds(Number('0.' + d[12]) * 1000)
  }

  return date
}

/**
 * Converts a JavaScript Date object to an ISO8601 timestamp.
 *
 * @param {Date} date - Date object.
 * @return {String}   - String representation of timestamp.
 */
dateFormatter.encodeIso8601 = function(date) {
  return zeroPad(date.getFullYear(), 4)
    + zeroPad(date.getMonth() + 1, 2)
    + zeroPad(date.getDate(), 2)
    + 'T'
    + zeroPad(date.getHours(), 2)
    + ':'
    + zeroPad(date.getMinutes(), 2)
    + ':'
    + zeroPad(date.getSeconds(), 2)
}

/**
 * Helper function to pad the digits with 0s to meet date formatting
 * requirements.
 *
 * @param {Number} digit  - The number to pad.
 * @param {Number} length - Length of digit string, prefix with 0s if not
 *                          already length.
 * @return {String}       - String with the padded digit
 */
function zeroPad(digit, length) {
  var padded = '' + digit
  while (padded.length < length) {
    padded = '0' + padded
  }

  return padded
}

