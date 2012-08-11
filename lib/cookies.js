
function Cookies() {
  this.cookies = {};

}

Cookies.prototype = {
  get: function(name) {
    var cookie = this.cookies[name];
    if (cookie && this.checkNotExpired(name))
      return this.cookies[name].value;
    return null;
  },

  set: function(name, value, options) {
    var cookie = typeof options == "object"
        ? {value: value, expires: options.expires, secure: options.secure || false, new: options.new || false}
        : {value: value}
    if (this.checkNotExpired(name, cookie)) {
      this.cookies[name] = cookie;
    }
  },

  //for testing purposes
  getExpirationDate: function(name) {

    return this.cookies[name] ? this.cookies[name].expires : null;
  },

  checkNotExpired: function(name, cookie) {
    if (typeof cookie === 'undefined') cookie = this.cookies[name];
    var now = new Date();
    if (cookie && cookie.expires && now > cookie.expires) {
      delete this.cookies[name];
      return false;
    }
    return true;
  },


  parseResponse: function(headers) {
    var cookies = headers["set-cookie"];
    if (cookies) {
      cookies.forEach(function(c) {
        var cookiesParams = c.split(";");
        var cookiePair = cookiesParams.shift().split("=");
        var options = {};
        cookiesParams.forEach(function(param) {
          param = param.trim();
          if (param.toLowerCase().indexOf("expires") == 0) {
            var date = param.split("=")[1].trim();
            options.expires = new Date(date);
          }
        });
        this.set(cookiePair[0].trim(), cookiePair[1].trim(), options);
      }.bind(this));
    }
  },

  composeRequest: function(headers) {
    if (Object.keys(this.cookies).length == 0) return;
    headers['Cookie'] = this.toString();
  },


  toString: function() {
    return Object.keys(this.cookies)
      .filter(this.checkNotExpired.bind(this))
      .map(function(name) {
      return name + "=" + this.cookies[name].value;
    }.bind(this)).join(";");
  }
};

module.exports = Cookies
