var http         = require('http')
  , xmlrpcParser = require('./xmlrpc-parser.js')

function Client(requestOptions) {

  // Invokes with new if called without
  if (false === (this instanceof Client)) {
    return new Client(requestOptions)
  }

  requestOptions.method = 'POST'
  requestOptions.headers =
  { "User-Agent"     : "NodeJS XML-RPC Client"
  , "Content-Type"   : "text/xml"
  , "Accept"         : "text/xml"
  , "Accept-Charset" : "UTF8"
  }

  this.requestOptions = requestOptions
}

Client.prototype.call = function(method, params, callback) {
  var that = this

  xmlrpcParser.createCallXml(method, params, function(err, xml) {

    that.requestOptions.headers['Content-Length'] = xml.length
    var req = http.request(that.requestOptions, function(res) {
      res.setEncoding('utf8');

      res.on('data', function (chunk) {
        //xmlrpcParser.parseResponseXml(chunk)
        console.log('BODY' + chunk)
      })

    })

    req.write(xml, 'utf8')
    req.end()
  })

}

module.exports = Client

