var util = require('util')
  , crypton = require('crypto')
  , fs = require('fs')
  , http = require('http')
  , path = require('path')
  , spawn = require('child_process').spawn
  , url = require('url')
  , EventEmitter = require('events').EventEmitter;

var Fetcher = function(config) {
  var self = this;
	EventEmitter.call(self);
  self.config = config || {};

  self.files = [];
  self.current_file = 0;
  self.payload_ready = false;
};

util.inherits(Fetcher, EventEmitter);

Fetcher.prototype._payload_update_completed = function () {
  var self = this;
  self.payload_ready = true;
  self.emit('update-complete');
}

Fetcher.prototype.self_update = function() {
  var self = this;
  self.check_launcher();
}

Fetcher.prototype.check_launcher = function() {
  var self = this;

	var conf = {};
	var file_name = "package.nw";
	var options = url.parse(self.config.httpupdater.baseurl + file_name);
	options.method = 'head';
	var request = http.request(options, function(response) {
		try {
			conf = JSON.parse(fs.readFileSync(path.join(self.config.local_base_dir, './cache/cache.json')));
		} catch (e) {
			;
		}
		if (conf.etag == response.headers['etag']) {
      self.emit('selfupdate-status', false);
		} else {
      self.emit('selfupdate-status', true);
		}
	});
	request.end();
}

Fetcher.prototype.download_launcher = function() {
  var self = this;
	var file_name = "package.nw";
	window.makedirs(path.dirname(path.join(self.config.local_base_dir, file_name)));
	var request = http.get(self.config.httpupdater.baseurl + file_name, function(response) {
		if (response.statusCode == 200) {
			var downloaded = 0;
			var speed = 0;
			var start_time = new Date().getTime();
			var file = fs.createWriteStream(path.join(self.config.local_base_dir, file_name));

			window.localStorage.lastEtag = response.headers['etag'];
			try {
				fs.writeFileSync(path.join(self.config.local_base_dir, './cache/cache.json'), JSON.stringify({"etag": response.headers['etag']}, null, 4));
			} catch (e) {
				;
			}

			response.on('data', function (chunk) {
				downloaded += chunk.length;
				total = response.headers['content-length'];
				duration = (new Date().getTime() - start_time) / 1000;
				speed = downloaded / duration;
				self.emit('selfupdate-progress', downloaded, total, speed);
			});

			response.on('end', function() {
				file.end(function() {
					self.emit('selfupdate-complete');
				});
			});

			response.pipe(file);
		}
	});
}

Fetcher.prototype.download_manifest = function(cb) {
  var self = this;
  var buffer = "";
  var request = http.get(this.config.httpupdater.baseurl + "files.txt", function(response) {
		response.on('data', function(chunk) {
			buffer += chunk;
		});

		response.on('end', function () {
      self.files = (JSON.parse(buffer)).files;
			if (cb !== undefined) {
				var changed = true;
				var hash = crypton.createHash('sha256');
				hash.update(buffer);
				var currentChecksum = hash.digest('hex');
				if (window.localStorage.lastChksum == currentChecksum) {
					changed = false;
				} else {
					window.localStorage.updateRequired = true;
					window.localStorage.lastChksum = currentChecksum;
				}
				cb(changed);
			}
		});
  });
}

Fetcher.prototype.update_payload = function() {
  var self = this;
	console.log('Fetcher.update_payload');

  self.emit('update-started');
  self.download_manifest(function(changed) {
    if (changed || window.localStorage.updateRequired == "true") {
      self.fetch_next_file();
    } else {
      self._payload_update_completed();
    }
  });
}

Fetcher.prototype.run_payload = function() {
  var self = this;

  spawn(path.join(self.config.local_base_dir, self.config.payload.executable), {detached: true});
}

Fetcher.prototype.fetch_file = function() {
	this.emit('fetch-started');
}

Fetcher.prototype.fetch_next_file = function() {
  var self = this;

  self.fetch_file();
  if( self.current_file < self.files.length) {
		var file_info = self.files[self.current_file++];
    self.verify_file(file_info[0], file_info[1]);
	} else {
		self._payload_update_completed();
	}
}

Fetcher.prototype.verify_file = function(file_name, checksum) {
  var self = this;
  console.log('verify_file:', file_name, checksum);
	self.emit('verify-started', self.current_file + 1, self.files.length);

  var stream = fs.createReadStream(path.join(self.config.local_base_dir, file_name));
  var verified = 0;
  var size = 1;
  var hash = crypton.createHash('sha256');

  stream.on('open', function(fd) {
    var stats = fs.fstatSync(fd);
    size = stats.size;
  });

  stream.on('data', function(data) {
    hash.update(data);
    verified += data.length;
    self.emit('verify-progress', verified, size);
  });

  stream.on('end', function() {
    if(hash.digest('hex') == checksum) {
      self.emit('verify-success');
      console.log('Checksum ok for file ' + file_name);
    } else {
      self.emit('verify-failed', file_name);
      console.log('Checksum WRONG for file ' + file_name);
    }
  });

  stream.on('error', function(err) {
    console.log('File not found');
    self.emit('verify-failed', file_name);
  });
}

Fetcher.prototype.download_file = function(file_name) {
  var self = this;

  console.log('download_file', file_name);
  window.makedirs(path.dirname(path.join(self.config.local_base_dir, file_name)));
  var request = http.get(self.config.httpupdater.baseurl + file_name, function(response) {
    if (response.statusCode == 200)	{
      self.emit('download-started', file_name);
      var downloaded = 0;
      var speed = 0;
      var start_time = new Date().getTime();
      var file = fs.createWriteStream(path.join(self.config.local_base_dir, file_name));

      response.on('data', function (chunk) {
        downloaded += chunk.length;
        total = response.headers['content-length'];
        duration = (new Date().getTime() - start_time) / 1000;
        speed = downloaded / duration;
        self.emit('download-progress', downloaded, total, speed);
      });

      response.on('end', function() {
        file.end(function() {
          self.emit('download-complete');
        });
      });

      response.pipe(file);
    }
  });
}

module.exports = Fetcher;
