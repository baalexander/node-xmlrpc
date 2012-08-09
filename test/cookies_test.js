var vows    = require('vows')
  , assert  = require('assert')
  , http    = require('http')
  , Cookies  = require('../lib/cookies')


vows.describe('Cookies').addBatch({
  'Set/Get functionality': {
    'set cookie with value only': {
      topic: function() {
        var cookies = new Cookies();
        cookies.set("a", "b");
        return cookies.get("a");
      },
      'it shall be possible to get this value': function(value) {
        assert.equal(value, "b")
      }
    },
    'get non-existent cookie': {
      topic: function() {
        var cookies = new Cookies();
        this.callback(null, cookies.get("c"));
      },
      'it shall return undefined': function(value) {
        assert.isUndefined(value);
      }
    },
    'set cookie with expiration date in the future': {
      topic: function() {
        var cookies = new Cookies();
        var date = new Date();
        date.setFullYear(date.getFullYear()+5);
        cookies.set("a", "b", {expires: date});
        return cookies.get("a");
      },
      'it shall be possible to get this value': function(value) {
        assert.equal(value, "b")
      }
    },
    'set cookie with expiration date in the past': {
      topic: function() {
        var cookies = new Cookies();
        var date = new Date();
        date.setDate(date.getDate()-1);
        cookies.set("a", "b", {expires: date});
        this.callback(null, cookies.get("a"));
      },
      'it shall not be possible to get this value': function(value) {
        assert.isUndefined(value)
      }
    }
  }
  //TODO: composeRequest/parseResponse
  //TODO: server tests
}).export(module);