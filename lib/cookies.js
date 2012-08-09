
function Cookies() {
  this.cookies = {};

}

Cookies.prototype = {
  get: function(name) {
    var cookie = this.cookies[name];
    if (cookie && this.checkNotExpired(name))
      return this.cookies[name].value;
    return undefined;
  },
  set: function(name, value, options) {
    var cookie = typeof options == "object"
        ? {value: value, expires: options.expires, secure: options.secure || false, new: options.new || false}
        : {value: value}
    if (this.checkNotExpired(name, cookie)) {
      this.cookies[name] = cookie;
    }
  },
  cookie: function(name, value) {
    if (typeof value == "undefined" ) {
      return this.get(name);
    }
    else {
      this.set(name);
      return this;
    }
  },

  checkNotExpired: function(name, cookie) {
    if (typeof cookie === 'undefined') cookie = this.cookies[name];
    var now = new Date();
    if (cookie && cookie.expires && now > cookie.expires) {
      this.cookies[name] = undefined;
      return false;
    }
    return true;
  },


  parseResponse: function(headers) {
    var cookies = headers["set-cookie"];
    if (cookies) {
      cookies.forEach(function(c) {
        var cookiesParams = c.split(";");
        var cookiePair = cookiesParams[0].split("=");
        var options = {};
        //TODO: parse other cookies params
        this.set(cookiePair[0], cookiePair[1], options);
      }.bind(this));
    }
  },

  composeRequest: function(headers) {
    headers['Cookie'] = this.toString();
  },

  parseRequest: function(headers) {
    var cookies = headers["cookie"];
    if (cookies) {
      var cookiesParams = c.split(";");
      var cookiePair = cookiesParams[0].split("=");
      this.set(cookiePair[0], cookiePair[1], {});
    }
  },

  composeResponse: function(headers) {
    headers['Set-Cookie'] = Object.keys(this.cookies)
      .map(function(name) {
      return {name: name, cookie: this.cookies[name]}
    }.bind(this))
      .filter(function(pair) {return pair.cookie.new})
      .map(this.cookieToString);
  },

  toString: function() {
    return Object.keys(this.cookies)
      .filter(this.checkNotExpired.bind(this))
      .map(function(name) {
      return name + "=" + this.cookies[name].value;
    }.bind(this)).join(";");
  },

  cookieToString: function(pair) {
    var name = pair.name;
    var cookies = pair.cookie;
    var cookieStr = name + "=" + cookies.value;
    if (cookies.expires) {
      cookieStr += ";" + cookies.expires.toUTCString();
    }
    if (cookies.secure) {
      cookieStr += "; secure";
    }
    return cookieStr;
  }
};

module.exports = Cookies
