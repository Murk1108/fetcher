String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

function makedirs (p, opts, made) {
	if (!opts || typeof opts !== 'object') {
		opts = { mode: opts };
	}

	var mode = opts.mode;
	var xfs = opts.fs || fs;

	if (mode === undefined) {
		mode = 0777 & (~process.umask());
	}

	if (!made) made = null;
	p = path.resolve(p);

	try {
		xfs.mkdirSync(p, mode);
		made = made || p;
	}
	catch (err0) {
		switch (err0.code) {
			case 'ENOENT' :
				made = makedirs(path.dirname(p), opts, made);
				makedirs(p, opts, made);
				break;

			// In the case of any other error, just see if there's a dir
			// there already. If so, then hooray! If not, then something
			// is borked.
			default:
				var stat;
				try {
					stat = xfs.statSync(p);
				}
				catch (err1) {
					throw err0;
				}

				if (!stat.isDirectory()) throw err0;
				break;
		}
	}
	return made;
};
