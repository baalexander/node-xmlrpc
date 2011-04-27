var xmlBuilder = require('xmlbuilder')

function Client() {
  if (false === (this instanceof Client)) {
    return new Client()
  }
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
        // Since no is_int or is_float in JavaScript, determines based on
        // if a remainder
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

        // Uses XML-RPC's date
        if (param.constructor.name == 'Date') {
          //value.node('dateTime.iso8601', H.iso8601Encode(param));
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
        /*
          var data = value.node('struct');
          var member;
          for(var key in param) {
            if (param.hasOwnProperty(key)) {
              member = data.node('member');
              member.node('name', key)
              _serialize(param[key], member);
            }
          }
        */
        }
        break;
    }
  }

  console.log(xml.toString({ pretty: true }))
}

module.exports = Client

