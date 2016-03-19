# Fetcher
*A downloader, updater and launcher for games and other applications.*

## Background

`fetcher` makes use of electron.

## Prepare your payload

`fetcher` can download all files that your application uses from a single HTTP resource. The directory structure on the web server needs to be identical to the layout of the user's installation. To let fetcher know what files to download and what their checksums are, it first retreives a file called `manifest.json`.

This file must contain a JSON formatted object with a field called ```files```, which is a list of two-elements tuples containing the file path relative to the URL that the files are retrieved from and a sha256 checksum. This file should also include a field ```executable```, which holds the relative path to the binary for your application that should be started once the update process is complete.

```
{
    "executable": "MyAwesomeApp/Awesome.exe",
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

The first step to create an updater for your application is to edit copy the `example` directory to a new location. The recommended name for this directory is `src`, to allow the predefined commands to work as expected. The first change that you should make is update the `src/package.json` file. This contains the required data structure to configure fetcher.

A specific subfield called ```fetcher``` holds every configuration option required to tell `fetcher` from where to download the files for your application and which binary to run after the file verification/download is complete.

### httpupdate.baseurl

(string) URL to the resource that holds the files for your application

## Previewing and packaging

To preview the customization that you have made and to prepare a final package for your application, you should first install the required dependencies with ```npm install```.

You can start a preview of your custom launcher by running
```
npm start
```

Please note that to better control where fetche stores your application data and its internal settings and caches, you can make use of the following two environment variables:

### FETCHER_CACHE_DIR

This gets passed to electron's chromium ```userData``` setting. This directory is used to hold things like the HTML5 local storage.

### FETCHER_PAYLOAD_DIR

This should point to the directory where fetcher is supposed to store the data for your application. It will download your payload to this directory.

For example, you can run your preview using:

```
FETCHER_CACHE_DIR=/home/username/projects/my_launcher/cache FETCHER_PAYLOAD_DIR=/home/username/projects/my_launcher/tmp/ npm start
```

When packaging your application, fetcher will set both this directories to whereever it's executable is stored. Note that npm start will only work when your custom launcher is located in the ```src``` directory.

## License

`fetcher`'s code in this repository uses the MIT license, see the `LICENSE` file. Since this is based on `electron`, which in turn is among others based on Chromium, multiple open source license notices are needed in the final distribution including the MIT License, the LGPL, the BSD, the Ms-PL and an MPL/GPL/LGPL tri-license. If you use the predefined packaging command, the final distribution will include every license file that your end users need.
