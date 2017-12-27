#!/usr/bin/env node

// MIT License
//
// Copyright 2017 Electric Imp
//
// SPDX-License-Identifier: MIT
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO
// EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES
// OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
// ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
// OTHER DEALINGS IN THE SOFTWARE.

'use strict';

const program = require('commander');
const Verifier = require('./index.js');
let checkedFolder = '';

let excludeFile = null;
let fixable = false;

program
    .version('0.0.1', '-v, --version')
    .arguments('<path>')
    .action(function (path) {
        checkedFolder = path;
    })
    .option('--exclude-file <file>', 'specify file with exclude list', (file) => {
        excludeFile = file;
    })
    .option('--fix', 'Fix warnings if possible', (enable) => {
        fixable = true;
    })
    .parse(process.argv);

if (process.argv.length < 3) {
    program.outputHelp();
    return;
}

if (checkedFolder === '') {
    console.log('Path is not specified');
    return;
}

const verifier = new Verifier(excludeFile, fixable);
verifier
.verify(checkedFolder)
.catch(function(reason) {
  console.error(reason);
  process.exit(1);
});
