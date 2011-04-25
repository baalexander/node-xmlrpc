var Client = require('./client');

var xmlrpc = exports;

xmlrpc.createClient = function(options) {
  return new Client();
};

