#!/bin/bash
pushd cache
wget http://dl.node-webkit.org/v0.11.2/node-webkit-v0.11.2-linux-x64.tar.gz
tar xzf node-webkit-v0.11.2-linux-x64.tar.gz
wget http://dl.node-webkit.org/v0.11.2/node-webkit-v0.11.2-win-ia32.zip
unzip node-webkit-v0.11.2-win-ia32.zip
popd
