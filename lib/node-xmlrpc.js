var Client = require('./client');

var xmlrpc = exports;

xmlrpc.createClient = function(http) {
  return new Client(http);
};

