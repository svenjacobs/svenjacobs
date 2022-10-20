#!/usr/bin/env sh
mkdir build 2>/dev/null
rm -rf build/*
html-minifier --collapse-whitespace \
    --remove-comments \
    --minify-css true \
    --minify-js true \
    -o build/index.html \
    src/index.html
cp -r src/assets build/assets

