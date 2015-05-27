var gui = require('nw.gui');
var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;

var Fetcher = require('./fetcher.js');

var config = require('./package.json').fetcher;
config.local_base_dir = '.';
config.local_base_dir = path.dirname(process.execPath);
var fetcher = new Fetcher(config);

function exit() {
  gui.App.quit();
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
	set_progress_text('Verifying file ' + a + ' of ' + b);
});

fetcher.on('verify-progress', set_progress);

fetcher.on('verify-failed', fetcher.download_file);

fetcher.on('verify-success', fetcher.fetch_next_file);

fetcher.on('download-started', function(file_name) {
	console.log("downloading: " + file_name);
});

fetcher.on('download-progress', function(downloaded, total, speed) {
	set_progress(downloaded, total);
	set_progress_text('Downloading file ' + (fetcher.current_file + 1) + ' of ' + fetcher.files.length + ', ' + (downloaded / (1024 * 1024)).toFixed(1) + ' MB of ' + (total / (1024 * 1024)).toFixed(1) + ' MB @ ' + (speed / 1024) .toFixed(0) + ' kB/sec');
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
	set_progress_text('Downloading new launcher ' + (downloaded / (1024 * 1024)).toFixed(1) + ' MB of ' + (total / (1024 * 1024)).toFixed(1) + ' MB @ ' + (speed / 1024) .toFixed(0) + ' kB/sec');
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
	if (false) { //document.getElementById('autostart').checked) {
		run();
	}
});

function run() {
	if (fetcher.payload_ready) {
		set_status('Launching application...');
		fetcher.run_payload();
		exit();
	}
}

document.addEventListener('DOMContentLoaded', function(event) {
	var win = gui.Window.get();

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
		return false;
	});

	if (gui.App.argv.length == 0) {
		set_status('Checking launcher version');
		fetcher.self_update();
	} else {
		set_status('Update in progress')
		fetcher.update_payload();
	}
});
