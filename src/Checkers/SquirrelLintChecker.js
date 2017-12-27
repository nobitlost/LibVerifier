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

const fs = require('fs');
const path = require('path');

const checker = require('./AbstractChecker');

const lint = require('fs');

class SquirrelLintChecker extends checker {
  constructor(linter, exclude = null) {
    super();
    this._linter = linter;
    this._extensionSet = new Set([".nut"]);
    this._excludeList = exclude || [];
  }

  /**
   * Check path for License mistakes
   * @param {String} dirpath
   * @return {[ErrorMessage]}
   */
  check(dirpath, shouldFix = false) {
    const allFiles = this._getFiles(dirpath, []);
    const errors = [];
    const files = [];
    errors.push(false);
    // list all squirrel files
    for (const file of allFiles) {
      const parsedPath = path.parse(file);
      // list of files
      if (this._extensionSet.has(parsedPath.ext)) {
        files.push(file);
      }
    }

    return new Promise((resolve, reject) => {
      this._linter.lintFiles(files, {fix : shouldFix}, (error, data) => {
         if (error) {
           reject({error:error});
           return;
         }
         var formatter;
         try {
             formatter = this._linter.eslint.CLIEngine.getFormatter();
         }
         catch (e) {
             reject({error:e.message});
             return;
         }

         const output = formatter(data.results);
         resolve({output: output});
      }); // lintFiles
    }); // Promise
  }

  _isExclude(filepath) {
    return this._excludeList.some((regexp) => regexp.test(filepath));
  }

  _getFiles(dir, allFiles) {
    const checkedFiles = fs.readdirSync(dir);
    for (const file of checkedFiles) {
      const name = dir + '/' + file;
      if (!this._isExclude(name)) {
        if (fs.statSync(name).isDirectory()) {
          this._getFiles(name, allFiles);
        } else {
          allFiles.push(name);
        }
      }
    }
    return allFiles;
  }

}

module.exports = SquirrelLintChecker;
