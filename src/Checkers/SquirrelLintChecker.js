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
    this._extensionSet = [".nut"];
    this._excludeList = [];
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
      if (this._extensionSet.indexOf(parsedPath.ext) >= 0) {
        files.push(file);
      }
    }

    this._linter.lintFiles(files, {fix : shouldFix}, (error, data) => {
       var formatter;
       try {
           formatter = this._linter.eslint.CLIEngine.getFormatter();
       }
       catch (e) {
           log.error(e.message);
           return false;
       }

       const output = formatter(data.results);
       console.log(output);
    });

    return errors.filter((error) => error != false);
  }

  /**
   * Regexp list for exclude
   * @return {Array} return regexp lis
   */
  get excludeList() {
    return this._excludeList;
  }

  /**
   * Construct exclude regexp list from filename
   * @param {JSON} settings for exclude file. '' for default
   */
  set excludeList(settings) {
    if (settings === null) {
      this._excludeList = [];
      return;
    }
    const filenames = settings.SquirrelLintChecker;
    // filters not empty strings, and makes regular expression from template
    this._excludeList = filenames.map((value) => value.trimLeft()) // trim for "is commented" check
      .filter((value) => (value !== '' && value[0] !== '#'))
      .map((value) => minimatch.makeRe(value));
  }

  /**
   * @return {Set} set of extensions with leading dot
   */
  get extensionSet() {
    return this._extensionSet;
  }

  /**
   * @param {Set} set of extensions with leading dot
   */
  set extensionSet(set) {
    if (set instanceof Set) {
      this._extensionSet = set;
    } else {
      this.logger.error('Wrong argument type');
    }
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
