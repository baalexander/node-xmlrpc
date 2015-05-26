module.exports = function bind(fn, context) {
  return function __bind__ () {
    return fn.apply(context, arguments)
  }
}
