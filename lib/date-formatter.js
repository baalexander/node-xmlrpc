var dateFormatter = exports
  , iso_8601
  , iso_8601_validating

dateFormatter.decodeIso8601 = decodeIso8601
//dateFormatter.decodeIso8601 = decodeIso8601Validating

// Source: http://webcloud.se/log/JavaScript-and-ISO-8601/

/*
 * Converts a date time stamp following the ISO8601 format to a JavaScript Date
 * object.
 *
 * @param {String} time - String representation of timestamp.
 * @return {Date}       - Date object from timestamp.
 */
function decodeIso8601(time) {

  var d = time.toString().match(iso_8601)

  if ( ! d ) {
    throw new Error("xmlrpc: expected a ISO8601 datetime but got '" + str + "'")
  }

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
  // TODO timezone

  return date
}

iso_8601 = new RegExp('([0-9]{4})([-]?([0-9]{2})([-]?([0-9]{2})'
                    + '(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?'
                    + '(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?')
/**
 * Converts a JavaScript Date object to an ISO8601 timestamp.
 *
 * @param {Date} date - Date object.
 * @return {String}   - String representation of timestamp.
 */
dateFormatter.encodeIso8601 = function encodeIso8601(date) {
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


function decodeIso8601Validating(str) {
  var m = str.match(iso_8601_validating)

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

// Source: http://my.safaribooksonline.com/book/programming/regular-expressions/9780596802837/validation-and-formatting/validate_iso_8601_dates_and_times#X2ludGVybmFsX0ZsYXNoUmVhZGVyP3htbGlkPTk3ODA1OTY4MDI4MzcvMjM5
// with modifications: ignore dashes
iso_8601_validating =
    new RegExp('^(-?(?:[1-9][0-9]*)?[0-9]{4})-?(1[0-2]|0[1-9])'
             + '-?(3[0-1]|0[1-9]|[1-2][0-9])T(2[0-3]|[0-1][0-9])'
             + ':([0-5][0-9]):([0-5][0-9])(\.[0-9]+)?'
             + '(Z|[+-](?:2[0-3]|[0-1][0-9]):[0-5][0-9])?$')

