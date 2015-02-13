var crypton = require('crypto');
var gui = require('nw.gui');
var http = require('http');
var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;
var url = require('url');

var file_list = [];
var current_file = 0;
var state = 0;
var local_base_dir = '.';
var launcher_updated_required = true;

var config = require('./fetcher.json');

var local_base_dir = path.dirname(process.execPath);

function set_status(text) {
	document.querySelector('#statusbar').textContent = text;
}

function set_progress(value, total) {
	document.querySelector('x-progressbar').progress((value / total) * 100);
}

function set_progress_text(text) {
	document.querySelector('x-progressbar').text(text);
}

function download_manifest(cb) {
	set_status('Checking for updates');
  var buffer = "";
  var request = http.get(config.httpupdater.baseurl + "files.txt", function(response) {
	response.on('data', function(chunk) {
		buffer += chunk;
	});

	response.on('end', function () {
		if (cb !== undefined) {
			var changed = true;
			var hash = crypton.createHash('sha256');
			hash.update(buffer);
			var currentChecksum = hash.digest('hex');
			if (localStorage.lastChksum == currentChecksum) {
				changed = false;
			} else {
				localStorage.updateRequired = true;
				localStorage.lastChksum = currentChecksum;
			}
			cb(JSON.parse(buffer), changed);
		}
	});
  });
}

function verify_file(file_name, checksum, cb) {
  var stream = fs.createReadStream(path.join(local_base_dir, file_name));
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
    set_progress(verified, size);
  });

  stream.on('end', function() {
    if(hash.digest('hex') == checksum) {
      console.log('Checksum ok for file ' + file_name);
      cb(true);
    } else {
      console.log('Checksum WRONG for file ' + file_name);
      cb(false);
    }
  });

  stream.on('error', function(err) {
    console.log('File not found');
    cb(false);
  });
}

function fetch_file(cb) {
	if( current_file < file_list.length) {
		var file_info = file_list[current_file];
		set_progress_text('Verifying file ' + (current_file + 1) + ' of ' + file_list.length);
    		verify_file(file_info[0], file_info[1], function(result) {
			if (!result) {
				download_file(file_info[0], function () {
					current_file++;
					fetch_file(cb);	
				});
			} else {
				current_file++;
				fetch_file(cb);
			}
		});
	} else {
		console.log('fetch files completed');
		localStorage.updateRequired = false;
		if ( cb !== undefined) {
			cb();
		}
	}
}

function download_file(file_name, cb) {
	console.log("downloading: " + file_name);
	makedirs(path.dirname(path.join(local_base_dir, file_name)));
	var request = http.get(config.httpupdater.baseurl + file_name, function(response) {
		if (response.statusCode == 200)	{
			var downloaded = 0;
			var speed = 0;
			var start_time = new Date().getTime();
			var file = fs.createWriteStream(path.join(local_base_dir, file_name));

			response.on('data', function (chunk) {
				downloaded += chunk.length;
				total = response.headers['content-length'];
				duration = (new Date().getTime() - start_time) / 1000;
				speed = downloaded / duration;
				set_progress(downloaded, total);
				set_progress_text('Downloading file ' + (current_file + 1) + ' of ' + file_list.length + ', ' + (downloaded / (1024 * 1024)).toFixed(1) + ' MB of ' + (total / (1024 * 1024)).toFixed(1) + ' MB @ ' + (speed / 1024) .toFixed(0) + ' kB/sec');
			});

			response.on('end', function() {
				file.end(function() {
					if (cb !== undefined) {
						cb();
					}
				});
			});

			response.pipe(file);			
		}
	});
}

function check_launcher(cb) {
	var conf = {};
	var file_name = "package.nw";
	var options = url.parse(config.httpupdater.baseurl + file_name);
	options.method = 'head';
	var request = http.request(options, function(response) {
		try {
			conf = JSON.parse(fs.readFileSync(path.join(local_base_dir, './cache/cache.json')));
		} catch (e) {
			;
		}
		console.log(conf);
		if (conf.etag == response.headers['etag']) {
			cb(false);
		} else {
			cb(true);
		}
	});
	request.end();
}

function download_launcher(cb) {
	var file_name = "package.nw";
	makedirs(path.dirname(path.join(local_base_dir, file_name)));
	var request = http.get(config.httpupdater.baseurl + file_name, function(response) {
		if (response.statusCode == 200) {
			var downloaded = 0;
			var speed = 0;
			var start_time = new Date().getTime();
			var file = fs.createWriteStream(path.join(local_base_dir, file_name));
			
			localStorage.lastEtag = response.headers['etag'];
			try {
				fs.writeFileSync(path.join(local_base_dir, './cache/cache.json'), JSON.stringify({"etag": response.headers['etag']}, null, 4));
			} catch (e) {
				;
			}

			response.on('data', function (chunk) {
				downloaded += chunk.length;
				total = response.headers['content-length'];			
				duration = (new Date().getTime() - start_time) / 1000;
				speed = downloaded / duration;
				set_progress(downloaded, total);
				set_progress_text('Downloading new launcher ' + (downloaded / (1024 * 1024)).toFixed(1) + ' MB of ' + (total / (1024 * 1024)).toFixed(1) + ' MB @ ' + (speed / 1024) .toFixed(0) + ' kB/sec');
			});

			response.on('end', function() {
				file.end(function() {
					if (cb !== undefined) {
						cb();
					}	
				});
			});

			response.pipe(file);	
		}
	});
}

function exit() {
  gui.App.quit();
}

function run() {
	if (launcher_updated_required) {
		return;
	}
	if (state == 1) {
		current_file = 0;
		state = 2;
		set_status('Update in progress')
		fetch_file(function() {
			set_status('Update complete - ready to launch.');
			document.getElementById('btn').innerHTML = 'Run';
			state = 3;
			if (true) { //document.getElementById('autostart').checked) {
				run();
			} 
		});
	}
	if (state == 3) {
		set_status('Launching application...');
		spawn(path.join(local_base_dir, config.app.executable), {detached: true});
		exit();
	}
}

document.addEventListener('DOMContentLoaded', function(event) {
	var win = gui.Window.get();
	win.setResizable(config.ui.resizable);
	
	if (localStorage.autostart === undefined) {
		localStorage.autostart = false;
	}

	/*
	$('#autostart').change(function() {
		localStorage.autostart = $(this).is(":checked");
	});

	$('#autostart').prop('checked', localStorage.autostart === "true");
	*/

	document.querySelector('#btn').addEventListener('click', run);
	document.querySelector('#exit').addEventListener('click', exit);
	document.querySelector('#settings').addEventListener('click', function() {
		state = 1;
		return false;
	});

	check_launcher(function(updateAvailable) {
		set_status('Checking launcher version');
		if (updateAvailable) {
			if (gui.App.argv.length == 0) {
				download_launcher(function() {
					spawn(process.execPath, {detached: true}).unref();
					gui.App.quit();
				});
			} else {
				launcher_updated_required = false;
				console.log('Update available, but disabled via argument');
				download_manifest(function(data, changed) {
					file_list = data.files;
					if (changed || localStorage.updateRequired == "true") {
						state = 1;
					} else {
						state = 3;
						if (true) { //document.getElementById('autostart').checked) {
							//run();
						} 
					}
					run();
				});
			}
		} else {
			launcher_updated_required = false;
			download_manifest(function(data, changed) {
				file_list = data.files;
				if (changed || localStorage.updateRequired == "true") {
					state = 1;
				} else {
					state = 3;
					if (true) { //document.getElementById('autostart').checked) {
						//run();
					} 
				}
				run();
			});
		}
	});
});
