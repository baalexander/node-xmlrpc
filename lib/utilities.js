
exports.deepCopy = function deepCopy(obj) {
  if (Array.isArray(obj)) {
    return obj.slice()
  } else if (typeof obj === 'object') {
    var copy = {} , p
    for ( p in obj ) {
      copy[p] = deepCopy(obj[p])
    }
    return copy
  }
  return obj
}

exports.invoke = function invoke(obj, method) {
  var f = typeof method === 'function' ? f : obj[method]
  return function() { f.apply(obj, arguments) }
}

