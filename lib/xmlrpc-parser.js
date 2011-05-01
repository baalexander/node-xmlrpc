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
      console.log('END DOCUMENT')
      callback(null, params)
    })

    res.onStartElementNS(function(element, attributes, prefix, uri, namespaces) {
      switch (element) {
        case 'param':
          console.log('NEW PARAM')
          deserializeParam(res, function (err, param) {
            console.log('RECEIVED PARAM' + param)
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

  var param = null
    , type  = null

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
      type = element
    }
    else if (element == 'array') {
      type = element
      // call separate function for arrays
    }
    else if (element == 'struct') {
      type = element
      // call separate function for struct
    }
  })

  parser.onEndElementNS(function(element, prefix, uri) {

    switch (element) {
      case 'param':
        console.log('RETURNING PARAM' + param)
        callback(null, param)
        break
    }

  })

  parser.onCharacters(function(chars) {
    switch (type) {
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
    console.log('CHARS:' + chars)
  })

}

