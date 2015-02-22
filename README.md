# Fetcher
*A downloader, updater and launcher for games and other applications.*

## Prepare your payload

`fetcher` can download all files that your application uses from a single HTTP resource. The directory structure on the web server needs to be identical to the layout of the user's installation. To let fetcher know what files to download and what their cchecksums are, it first retreives a file called `files.txt`.

This file must contain a JSON formatted object with a field called ```files```, which is a list of two-elements tuples containing the file path relative to the URL that the files are retrieved from and a sha256 checksum.

```
{
    "files": [
        [
            "MyAwesomeApp/Awesome.exe",
            "e3e05e79d10524f4f958de98e7c895b664006297029495754cec8ffe08d6918b"
        ],
        [
            "MyAwesomeApp/kindaawesome.dll",
            "d212bb57aacaee29312906c06f06b7225ced6ca85c79b42498d8d92977fd7a5a"
        ]
    ]
}
```

For a start, you can use the following python script to generate this file on the server:

```
#!/usr/bin/python
import hashlib
import json
import os
import sys

if not len(sys.argv) == 2:
    print "Please run with the root path as a single argument"
    sys.exit()

data = {
        "files": []
        }

for root, dirs, files in os.walk(sys.argv[1]):
    for file in files:
        #print "Generating checksum for:", file
        pth = os.path.join(root, file)
        chk = hashlib.sha256()
        with open(pth, 'r') as fd:
            while True:
                buf = fd.read(1024)
                if not buf:
                    break
                chk.update(buf)
        data['files'].append((pth, chk.hexdigest()))


print json.dumps(data, indent = 4)
```

## Build your own distribution for your payload

The first step to create an updater for your application is to edit `src/package.json`. This controls most of the basic behaviour of nw.js and fetcher. This file should be valid JSON. For details about the meaning of the fields in this file, please take a look at the nw.js documentation: [https://github.com/nwjs/nw.js/wiki/Manifest-format].

A specific subfield called `fetcher` holds every configuration option required to tell `fetcher` from where to download the files for your application and which binary to run after the file verification/download is complete.

### httpupdate.baseurl

(string) URL to the resource that holds the files for your application

### payload.executable

(string) relative path to the binary that should be run after the download is complete


## License

`fetcher`'s code in this repository uses the MIT license, see the `LICENSE` file. Since this is based on `nw.js`, which in turn is based on Chromium, multiple open source license notices are needed in the final distribution including the MIT License, the LGPL, the BSD, the Ms-PL and an MPL/GPL/LGPL tri-license.

