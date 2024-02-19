#!/usr/bin/env sh
mkdir build 2>/dev/null
rm -rf build/*
cp -r src/* build
pkgx npx --yes html-minifier@4.0.0 \
  --remove-comments \
  --minify-css true \
  --minify-js true \
  -o build/index.html \
  src/index.html
