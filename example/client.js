var http = require('http');
http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Client\n');
}).listen(3000, 'localhost');

console.log('Started the XMLRPC test client');

