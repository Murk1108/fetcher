rm -rf tmp/preview
mkdir -p tmp/preview
#zip -r tmp/preview/package.nw app package.json
cp -r cache/latest/* tmp/preview
cp -r src/* fetcher.json tmp/preview
mkdir tmp/preview/cache
mv tmp/preview/nw tmp/preview/fem-launcher
pushd tmp/preview
./fem-launcher -preview .
popd
