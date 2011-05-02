var xmlParser     = require('node-xml')
  , dateFormatter = require('./date-formatter.js')

var xmlrpcParser = exports

xmlrpcParser.parseResponseXml = function(xml, callback) {
  deserializeParams(xml, callback)
}

function deserializeParams(xml, callback) {
  var params = []

  var saxParser = new xmlParser.SaxParser(function(res) {
    res.onEndDocument(function() {
      callback(null, params)
    })

    res.onStartElementNS(function(element, attributes, prefix, uri, namespaces) {
      switch (element) {
        case 'param':
          deserializeParam(res, function (err, param) {
            params.push(param)
          })
          break
      }
    })
  })

  saxParser.parseString(xml)
}

var flatParams   = ['boolean', 'dateTime.iso8601', 'double', 'int', 'i4', 'string', 'nil']
  , nestedParams = ['array', 'struct']

function deserializeParam(parser, callback) {

  parser.onStartElementNS(function(element, attributes, prefix, uri, namespaces) {
    // Checks if element is an XML-RPC data type
    var isFlatParam = false
    for (var i = 0; i < flatParams.length && !isFlatParam; i++) {
      if (flatParams[i] === element) {
        isFlatParam = true
      }
    }

    // A non-nested parameter
    if (isFlatParam) {
      var param = element
      parser.onCharacters(function(chars) {
        switch (element) {
          case 'boolean':
            param = chars == '1' ? true : false
            break
          case 'dateTime.iso8601':
            param = dateFormatter.decodeIso8601(chars)
            break
          case 'double':
            param = parseFloat(chars)
            break
          case 'i4':
          case 'int':
            param = parseInt(chars)
            break
          case 'string':
            param = chars
            break
        }
        callback(null, param)
      })
    }
    else if (element === 'array') {
      deserializeArrayParam(parser, function (err, param) {
        callback(null, param)
      })
    }
    else if (element === 'struct') {
      // call separate function for struct
    }
  })

}

function deserializeArrayParam(parser, callback) {

  var param = []

  parser.onStartElementNS(function(element, attributes, prefix, uri, namespaces) {
    if (element === 'value') {
      deserializeParam(parser, function(err, value) {
        param.push(value)
      })
    }
  })

  parser.onEndElementNS(function(element, prefix, uri) {
    if (element === 'array') {
      callback(null, param)
    }
  })
}

