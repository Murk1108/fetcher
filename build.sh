#!/bin/bash
rm -rf build/win
rm build/fem-launcher.zip
mkdir -p build/win/cache
cp -r cache/node-webkit-v0.11.2-win-ia32/{*dll,nw.exe,nw.pak,locales,icudtl.dat} build/win
pushd src
zip -x \*.swp -r ../build/win/package.nw .
popd
mv build/win/nw.exe build/win/fem-launcher.exe
ls -al build/win
pushd build/win
zip -r ../fem-launcher.zip .
