function Client() {
  if (false === (this instanceof Client)) {
    return new Client();
  }
}

Client.prototype.call = function() {

}

module.exports = Client;

