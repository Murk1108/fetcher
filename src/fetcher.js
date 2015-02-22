var util = require('util')
  , EventEmitter = require('events').EventEmitter;

var Fetcher = function() {
	EventEmitter.call(this);
};

util.inherits(Fetcher, EventEmitter);

Fetcher.prototype.update_payload = function() {
	console.log('Fetcher.update_payload');
}

Fetcher.prototype.fetch_file = function() {
	this.emit('fetch-started');
}

Fetcher.prototype.verify_file = function() {
	this.emit('verify-started');
}

Fetcher.prototype.files = [];
Fetcher.prototype.current_file = 0;

module.exports = Fetcher;
