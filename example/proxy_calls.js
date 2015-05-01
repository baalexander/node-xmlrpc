var xmlrpc = require('../lib/xmlrpc');

function logError (error) {
  console.log('An error occured: ' + error.message);
}

// Creates an XML-RPC server to listen to XML-RPC method calls
xmlrpc.createServer({ host: 'localhost', port: 9090 })
  // Handle methods not found
  .on('NotFound', function (method, params) {
    console.log('Method ' + method + ' does not exist');
  })
  // Handle method calls by listening for events with the method call name
  .on('company.employees.list', function (err, params, callback) {
    console.log('Method call params for \'company.employees.list\': ', params);

    callback(null, []);
  })
  .on('company.employees.getDetail', function (err, params, callback) {
    console.log('Method call params for \'company.employees.getDetail\': ', params);

    callback(null, { id: params[0], name: 'Ondrej' });
  });

console.log('XML-RPC server listening on port 9091')


setTimeout(function () {
  // Creates an XML-RPC client. Passes the host information on where to
  // make the XML-RPC calls.
  var client = xmlrpc.createClient({ host: 'localhost', port: 9090, path: '/'});

  client.$.company.employees.list()
    .then(function (value) {
      console.log('Method response for \'company.employees.list\': ', value);
    }).catch(logError);

  client.$.company.employees.getDetail(1, true)
    .then(function (value) {
      console.log('Method response for \'company.employees.getDetail\': ', value);
    }).catch(logError);

}, 1000);