var vows           = require('vows')
  , assert         = require('assert')
  , date_formatter = require('../lib/date_formatter')

var LOCAL_DATE = new Date(2014,0,20,14,25,25);

vows.describe('Date Formatter').addBatch({
  "A local date": {
    topic: LOCAL_DATE
  , "when encoded": {
      "without hyphens": encodeCase({hyphens: false}, '^\\d{8}T')
    , "with hyphens": encodeCase({hyphens: true}, '^\\d{4}[-]\\d{2}[-]\\d{2}T')
    , "without colons": encodeCase({colons: false}, 'T\\d{6}')
    , "with colons": encodeCase({colons: true}, 'T\\d{2}:\\d{2}:\\d{2}')
    , "without offset": encodeCase({offset: false}, 'T\\d{2}[:]?\\d{2}[:]?'
      + '\\d{2}(\\.\\d{3})?$')
    , "with offset": encodeCase({offset: true}, '([+-]\\d{2}[:]\\d{2}|Z)$')
    , "with milliseconds": encodeCase({ms: true}, '\\.\\d{3}([+-]\\d{2}[:]'
      + '\\d{2}|Z)?$')
    , "without milliseconds": encodeCase({ms: false}, 'T\\d{2}[:]?\\d{2}[:]?'
      + '\\d{2}([+-]\\d{2}[:]\\d{2}|Z)?$')
    , "to local representation": {
        topic: function (d) {
          date_formatter.setOpts()
          date_formatter.setOpts({local: true})
          return date_formatter.encodeIso8601(d)
        }
      , "must return a properly formatted string": function (e, str) {
          var reStr = '^\\d{4}[-]?\\d{2}[-]?\\d{2}T\\d{2}[:]?\\d{2}[:]?\\d{2}'
          + '(\\.\\d{3})?([+-]\\d{2}[:]\\d{2})?$'
          assert.isNull(e)
          assert.isString(str)
          assert.match(str, new RegExp(reStr))
        }
      , "must match the correct time": function (str) {
          var reStr = '^T14[:]?25[:]?25(\\.000)?([+-]\\d{2}[:]\\d{2})?$'
          assert.isString(str)
          assert.match(str, new RegExp())
        }
      , teardown: function () { date_formatter.setOpts() }
      }
    , "to utc representation": {
        topic: function (d) {
          date_formatter.setOpts()
          date_formatter.setOpts({local: false})
          return date_formatter.encodeIso8601(d)
        }
      , "must return a properly formatted string": function (e, str) {
          var reStr = '^\\d{4}[-]?\\d{2}[-]?\\d{2}T\\d{2}[:]?\\d{2}[:]?\\d{2}'
          + '(\\.\\d{3})?Z$'
          assert.isNull(e)
          assert.isString(str)
          assert.match(str, new RegExp(reStr))
        }
      , "must match the correct time": function (str) {
          var offset = LOCAL_DATE.getTimezoneOffset()
          var round = (offset < 0) ? 'ceil' : 'floor'
          var reStr = [
            'T[0]?'
          , 14+Math[round](offset/60)
          , '[:]?[0]?'
          , 25+(offset%60)
          , '[:]?25(\\.000)?Z'
          ].join('')
          assert.isString(str)
          assert.match(str, new RegExp(reStr))
        }
      , teardown: function () { date_formatter.setOpts() }
      }
    }
  }
}).addBatch({
  "When decoding": {
    "YYYY-MM-DDTHH:mm:ss.mss": decodeCase('2014-01-20T14:25:25.050'
      , localDate(2014,0,20,14,25,25,50))
  , "YYYY-MM-DDTHH:mm:ss": decodeCase('2014-01-20T14:25:25'
      , localDate(2014,0,20,14,25,25))
  , "YYYY-MM-DDTHH:mm": decodeCase('2014-01-20T14:25'
      , localDate(2014,0,20,14,25))
  , "YYYY-MM-DDTHH": decodeCase('2014-01-20T14'
      , localDate(2014,0,20,14))
  , "YYYY-MM-DD": decodeCase('2014-01-20'
      , localDate(2014,0,20))
  , "YYYYMMDDTHH:mm:ss": decodeCase('20140120T14:25:25'
      , localDate(2014,0,20,14,25,25))
  , "YYYYMMDDTHHmmss": decodeCase('20140120T142525'
      , localDate(2014,0,20,14,25,25))
  , "YYYYMMDDTHHmm": decodeCase('20140120T1425', localDate(2014,0,20,14,25))
  , "YYYYMMDD": decodeCase('20140120', localDate(2014,0,20))
  , "YYYY-MM-DDTHH:mm:ss.mssZ": decodeCase('2014-01-20T14:25:25.050Z'
      , '2014-01-20T14:25:25.050Z')
  , "YYYY-MM-DDTHH:mm:ssZ": decodeCase('2014-01-20T14:25:25Z'
      , '2014-01-20T14:25:25.000Z')
  , "YYYY-MM-DDTHHZ": decodeCase('2014-01-20T14Z', '2014-01-20T14:00:00.000Z')
  , "YYYY-MM-DDTHH:mm:ss.mss+hh:mm": decodeCase('2014-01-20T14:25:25.000+09:30'
      , function () {
        var d = new Date('2014-01-20T14:25:25.000Z')
        d.setUTCHours(d.getUTCHours() - 9)
        d.setUTCMinutes(d.getUTCMinutes() - 30)
        return d.toISOString()
      }
    )
  , "YYYY-MM-DDTHH:mm:ss.mss+hhmm": decodeCase('2014-01-20T14:25:25.000+0930'
      , function () {
        var d = new Date('2014-01-20T14:25:25.000Z')
        d.setUTCHours(d.getUTCHours() - 9)
        d.setUTCMinutes(d.getUTCMinutes() - 30)
        return d.toISOString()
      }
    )
  , "YYYY-MM-DDTHH:mm:ss.mss+hh": decodeCase('2014-01-20T14:25:25.000+09'
      , function () {
        var d = new Date('2014-01-20T14:25:25.000Z')
        d.setUTCHours(d.getUTCHours() - 9)
        return d.toISOString()
      }
    )
  }
}).export(module)

// HELPERS
function encodeCase (opts, reStr) {
  return {
    topic: function (d) {
      date_formatter.setOpts(opts)
      return date_formatter.encodeIso8601(d)
    }
  , "must return a properly formatted string": function (e, str) {
      assert.isNull(e)
      assert.isString(str)
      assert.match(str, new RegExp(reStr))
    }
  , teardown: function () { date_formatter.setOpts() }
  }
}

function decodeCase(str, check) {
  if (typeof(check) === 'function') check = check()
  return {
    topic: function () {
      return date_formatter.decodeIso8601(str)
    }
  , "must return the right Date": function (e, date) {
      assert.isNull(e)
      assert.instanceOf(date, Date)
      assert.equal(check, date.toISOString())
    }
  }
}

function localDate (y,M,d,h,m,s,ms) {
  return (new Date(y||0,M||0,d||0,h||0,m||0,s||0,ms||0)).toISOString()
}
