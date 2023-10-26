#!/usr/bin/env sh

mkdir build 2>/dev/null
rm -rf build/*
cp -r src/* build

COMMAND="html-minifier"
if command -v pkgx &> /dev/null
then
    COMMAND="pkgx npx --yes $COMMAND --"
fi

$COMMAND \
    --collapse-whitespace \
    --remove-comments \
    --minify-css true \
    --minify-js true \
    -o build/index.html \
    src/index.html
