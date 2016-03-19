const remote = require('electron').remote;
const Fetcher = require('./fetcher.js');
const config = require('./package.json').fetcher;

var fs = require('fs');
var spawn = require('child_process').spawn;
var path = require('path');

var fetcher = new Fetcher(config);

var closeEl = document.querySelector('.close');
closeEl.addEventListener('click', function () {
  remote.app.quit();
});

function format_bytes (bytes) {
  if (bytes < 1024) {
      return bytes + ' B';
  }

  if (bytes < (1024 * 1024)) {
      return ((bytes / 1024).toFixed(0)) + ' kB';
  }

  return ((bytes / (1024 * 1024)).toFixed(1)) + ' MB';
}

function set_status(text) {
	document.querySelector('#statusbar').textContent = text;
}

function set_progress(value, total) {
	document.querySelector('x-progressbar').progress((value / total) * 100);
}

function set_progress_text(text) {
	document.querySelector('x-progressbar').text(text);
}

fetcher.on('verify-started', function(a, b) {
	set_status('Updating...');
	set_progress_text('Verifying file ' + (a - 1) + ' of ' + b);
});

fetcher.on('verify-progress', set_progress);

fetcher.on('verify-failed', fetcher.download_file);

fetcher.on('verify-success', fetcher.fetch_next_file);

fetcher.on('download-started', function(file_name) {
	console.log("downloading: " + file_name);
});

fetcher.on('download-progress', function(downloaded, total, speed) {
	set_progress(downloaded, total);
	set_progress_text('Downloading file ' + (fetcher.current_file) + ' of ' + fetcher.files.length + ', ' + format_bytes(downloaded) + ' of ' + format_bytes(total) + ' @ ' + format_bytes(speed) + '/sec');
});

fetcher.on('download-complete', fetcher.fetch_next_file);

fetcher.on('selfupdate-status', function(updateAvailable) {
	if(updateAvailable) {
		fetcher.download_launcher();
	} else {
		fetcher.update_payload();
	}
});

fetcher.on('selfupdate-progress', function(downloaded, total, speed) {
	set_progress(downloaded, total);
	set_progress_text('Downloading new launcher ' + format_bytes(downloaded) + ' of ' + format_bytes(total) + ' @ ' + (speed / 1024) .toFixed(0) + ' kB/sec');
});

fetcher.on('selfupdate-complete', function() {
	spawn(process.execPath, {detached: true}).unref();
	gui.App.quit();
});

fetcher.on('update-started', function() {
	set_status('Checking for updates');
});

fetcher.on('update-complete', function() {
	console.log('fetch files completed');
	localStorage.updateRequired = false;
	set_status('Update complete - ready to launch.');
  document.getElementById('btn').disabled = false;
});

function run() {
	if (fetcher.payload_ready) {
		set_status('Launching application...');
		fetcher.run_payload();
		remote.app.quit();
	}
}
document.querySelector('#btn').addEventListener('click', run);

config.local_base_dir = process.env.FETCHER_PAYLOAD_DIR || path.dirname(remote.app.getPath('exe'));
//remote.getGlobal('console').log(config.local_base_dir);

set_status('Update in progress');
fetcher.update_payload();
