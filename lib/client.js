var xmlBuilder    = require('xmlbuilder')
  , dateFormatter = require('./date-formatter.js')

function Client(http) {
  //if (false === (this instanceof Client)) {
  //  console.log(http)
    this.http = http
  //}
}

Client.prototype.call = function(method, params, callback) {

  // Creates the boiler plate for the XML-RPC call
  var xml = xmlBuilder.begin('methodCall')
    .ele('methodName')
      .txt(method)
      .up()

  // Adds each parameter to the XML-RPC call
  params = params || []
  var paramsXml = xml.ele('params')
  for (var i = 0; i < params.length; i++) {
    var paramXml = paramsXml.ele('param')
    serializeParam(params[i], paramXml)
  }

  xmlString = xml.toString()
    console.log(xmlString)
  var headers = {
      "User-Agent"     : "NodeJS XML-RPC Client"
    , "Content-Type"   : "text/xml"
    , "Accept"         : "text/xml"
    , "Accept-Charset" : "UTF8"
  }
  headers['Content-Length'] = xmlString.length;
  var options2 = {
      host: 'localhost',
      port: 11311,
      path: '/',
      method: 'POST'
  };

  options2['headers'] = headers

  var req = this.http.request(options2, function(res) {
    res.setEncoding('utf8');
  
    res.on('data', function (chunk) {
      console.log('BODY' + chunk)
    })

  })

  req.write(xmlString, 'utf8')
  req.end()

  /*var me = this;

  req.addListener("response",  {
    var payload = "";
    res.setEncoding("utf8");


    res.addListener('data', function(payload) {
      console.log(payload)
      payload = H.trim(payload);

      // be tolerant of junk after methodResponse (e.g. javascript ads automatically inserted by free hosts)
      /*var pos = payload.lastIndexOf('</methodResponse>');
      if (pos >= 0) {
        payload = payload.slice(0, pos + 17);
      }

      if (payload == '') {
        me.emit('success', method, payload);
      }
      
      var doc, response, fault;
      try {
        doc = libxml.parseXmlString(payload);
        response = doc.root();
      } catch(e) {
        return me.emit('error', method, "Response seems not a regular XMLRPC one");
      }
      var fault;
      if (fault = H.getFault(response)) {
        return me.emit('error', method, "XMLRPC error: " + fault.faultString + " (" + fault.faultCode + ")");
      }

      var value = response.get('params/param/value');

      me.emit('success', method, H.parseValue(value));
    });
      
  });*/

  //return this;


  // Serializes the parameter (and child parameters recursively) to XML
  function serializeParam(param, paramXml) {

    // Adds boiler plate for the parameter
    var paramXml = paramXml.ele('value')

    switch (typeof param) {

      case 'boolean':
        logicalValue = param ? 1 : 0
        paramXml.ele('boolean')
          .txt(logicalValue)
        break;

      case 'string':
        paramXml.ele('string')
          .txt(param)
        break;

      case 'number':
        // Since no is_int or is_float in JavaScript, determines based
        // on if a remainder
        if (param % 1 == 0) {
          paramXml.ele('int')
            .txt(param)
        }
        else {
          paramXml.ele('double')
            .txt(param)
        }
        break;

      case 'object':

        // Uses XML-RPC's nil
        if (param == null) {
          paramXml.ele('nil')
        }

        // Uses XML-RPC's date
        else if (param.constructor.name == 'Date') {
          //console.log(param)
          paramXml.ele('dateTime.iso8601')
            .txt(dateFormatter.encodeIso8601(param))
        }

        // Uses XML-RPC's array
        else if (param.constructor.name == 'Array') {
          var arrayXml = paramXml.ele('array')
            .ele('data')

          for (var j = 0; j < param.length; j++) {
            serializeParam(param[j], arrayXml)
          }
        }

        // Uses XML-RPC's struct
        else if (param.constructor.name == 'Object') {
          var arrayXml = paramXml.ele('struct')

          for (var key in param) {
            if (param.hasOwnProperty(key)) {
              var memberXml = arrayXml.ele('member')
              memberXml.ele('name')
                .txt(key)
              serializeParam(param[key], memberXml)
            }
          }
        }
        break;
    }
  }

}

module.exports = Client

