var vows    = require('vows')
  , assert  = require('assert')
  , http    = require('http')
  , Cookies = require('../lib/cookies')

vows.describe('Cookies').addBatch({
  'Set/Get functionality': {
    'set cookie with value only': {
      topic: function() {
        var cookies = new Cookies()
        cookies.set('a', 'b')
        return cookies.get('a')
      },
      'it shall be possible to get this value': function(value) {
        assert.equal(value, 'b')
      }
    },
    'get non-existent cookie': {
      topic: function() {
        var cookies = new Cookies()
        this.callback(null, cookies.get('c'))
      },
      'it shall return undefined': function(value) {
        assert.isNull(value)
      }
    },
    'set cookie with expiration date in the future': {
      topic: function() {
        var cookies = new Cookies()
        var date = new Date()
        date.setFullYear(date.getFullYear()+5)
        cookies.set('a', 'b', {expires: date})
        return cookies.get('a')
      },
      'it shall be possible to get this value': function(value) {
        assert.equal(value, 'b')
      }
    },
    'set cookie with expiration date in the past': {
      topic: function() {
        var cookies = new Cookies()
        var date = new Date()
        date.setDate(date.getDate()-1)
        cookies.set('a', 'b', {expires: date})
        this.callback(null, cookies.get('a'))
      },
      'it shall not be possible to get this value': function(value) {
        assert.isNull(value)
      }
    }
  },
  'parseResponse': {
    'parsing response without cookies': {
      topic: function() {
        var cookies = new Cookies()
        cookies.parseResponse({})
        cookies.parseResponse({
          'set-cookie': []
        })
        return 'ok'
      },
      'shall not process any error': function(value) {
        //ok
      }
    },
    'parsing response with cookie without expiration date': {
      topic: function() {
        var cookies = new Cookies()
        cookies.parseResponse({
          'set-cookie': [' name=value ']
        })
        return cookies.get('name')
      },
      'shall get value of the cookie': function(value) {
        assert.equal(value, 'value')
      }
    },
    'response with cookie with expiration date': {
      topic: function() {
        var cookies = new Cookies()
        cookies.parseResponse({
          'set-cookie': [' name=value ;Expires=Wed, 01 Jan 2070 00:00:01 GMT ']
        })
        return cookies
      },
      'shall get value of the cookie': function(cookies) {
        assert.equal(cookies.get('name'), 'value')
      },
      'shall get expiration date of the cookie': function(cookies) {
        assert.equal(cookies.getExpirationDate('name').toUTCString(), 'Wed, 01 Jan 2070 00:00:01 GMT')
      }
    },
    'response with cookie with expiration date and other fields': {
      topic: function() {
        var cookies = new Cookies()
        cookies.parseResponse({
          'set-cookie': [' name=value ;some=thing;Expires=Wed, 01 Jan 2070 00:00:01 GMT ;any=thing ']
        })
        return cookies
      },
      'shall get value of the cookie': function(cookies) {
        assert.equal(cookies.get('name'), 'value')
      },
      'shall get expiration date of the cookie': function(cookies) {
        assert.equal(cookies.getExpirationDate('name').toUTCString(), 'Wed, 01 Jan 2070 00:00:01 GMT')
      }
    },
    'response with several cookies': {
      topic: function() {
        var cookies = new Cookies()
        cookies.parseResponse({
          'set-cookie': [' name=value ', 'name2=value2']
        })
        return cookies
      },
      'shall get value of all the cookies': function(cookies) {
        assert.equal(cookies.get('name'), 'value')
        assert.equal(cookies.get('name2'), 'value2')
      }
    }
  },
  'composeRequest': {
    'when there are not cookies set': {
      topic: new Cookies(),
      'shall not set cookie header': function(topic) {
        var headers = {}
        topic.composeRequest(headers)
        assert.isUndefined(headers['Cookie'])
      }
    },
    'when there is one cookie': {
      topic: function() {
        var cookies = new Cookies()
        cookies.set('a', 'b')
        return cookies
      },
      'shall set cookie header with name/value pair': function(topic) {
        var headers = {}
        topic.composeRequest(headers)
        assert.equal(headers['Cookie'], 'a=b')
      }
    },
    'when there are two cookies': {
      topic: function() {
        var cookies = new Cookies()
        cookies.set('a', 'b')
        cookies.set('c', 'd')
        return cookies
      },
      'shall set cookies header with name/value pairs separated by semicolon': function(topic) {
        var headers = {}
        topic.composeRequest(headers)
        assert.equal(headers['Cookie'], 'a=b;c=d')
      }
    },
    'when some cookie is expired': {
      topic: function() {
        var cookies = new Cookies()
        cookies.set('new', 'one')
        var date = new Date()
        date.setFullYear(date.getFullYear()-1)
        cookies.set('expired', 'value', {expires: date})
        return cookies
      },
      'shall set cookies header with non-expired cookies only': function(topic) {
        var headers = {}
        topic.composeRequest(headers)
        assert.equal(headers['Cookie'], 'new=one')
      }
    }
  }
}).export(module)