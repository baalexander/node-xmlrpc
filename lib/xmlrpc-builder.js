var xmlBuilder    = require('xmlbuilder')
  , dateFormatter = require('./date-formatter.js')

var xmlrpcBuilder = exports

xmlrpcBuilder.buildMethodCall = function(method, params, callback) {

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

  callback(null, xml.toString())
}

// Serializes the parameter (and child parameters recursively) to XML
function serializeParam(param, paramXml) {

  // Adds boiler plate for the parameter
  var paramXml = paramXml.ele('value')

  switch (typeof(param)) {

    case 'boolean':
      logicalValue = param ? 1 : 0
      paramXml.ele('boolean')
        .txt(logicalValue)
      break

    case 'string':
      paramXml.ele('string')
        .txt(param)
      break

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
      break

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
      break
  }
}

