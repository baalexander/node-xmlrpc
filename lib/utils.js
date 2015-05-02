function isProxyAPIAvailable () {
  return global.Proxy !== void 0;
}

if (isProxyAPIAvailable()) {
  // require Proxy API normalization polyfill because current V8's implementation doesn't support standardized API (2015-05-01)
  require('harmony-reflect');
}
else {
  console.info('ES6 Proxy API is not available. Run node with flag `--harmony-proxies` to make calls using this API.');
}

module.exports = {
  // https://gist.github.com/zdychacek/00d4853ab6856f3c6912
  createProxy: function (action) {
    // create the callable proxy
    function _createCallableProxy (name) {
      var methodNames = [ name ];
   
      return new Proxy(function () {}, {
        get: function (target, name, receiver) {
          // push a name of the method into the accumulator
          methodNames.push(name);
   
          return receiver;
        },
        apply: function (target, name, args) {
          // call the method finally
          var result = action(methodNames.join('.'), args);

          return result;
        }
      });
    }
   
    // create the main proxy object
    return new Proxy({}, {
      get: function (target, name) {
        return _createCallableProxy(name);
      }
    });
  },

  isProxyAPIAvailable: isProxyAPIAvailable
};
