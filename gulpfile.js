var spawn = require('child_process').spawn;
var gulp = require('gulp');
var gutil = require('gulp-util');

gulp.task('preview', function() {
	var child = spawn("bash", ["preview.sh"]);

	child.stdout.setEncoding('utf8');
	child.stderr.setEncoding('utf8');

	child.stdout.on('data', function(data) {
		gutil.log(data);
	});

	child.stderr.on('data', function(data) {
		gutil.log(data);
	});
});
