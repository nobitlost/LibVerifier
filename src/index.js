// MIT License

// Copyright 2017 Electric Imp

// SPDX-License-Identifier: MIT

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO
// EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES
// OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
// ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
// OTHER DEALINGS IN THE SOFTWARE.

'use strict';

const gitCloneOrPull = require('git-clone-or-pull');
const path = require('path');
const fs = require('fs');
const url = require('url');
const nodegit = require('nodegit');

const LicenseChecker = require('./Checkers/LicenseChecker');
const AbstractChecker = require('./Checkers/AbstractChecker');
const DEFAULT_EXCLUDE = '../excludes.json';

/**
 * Main Verifier class
 */
class Verifier {

  constructor() {
    this._local = false;
    this.excludeFile = DEFAULT_EXCLUDE;
    this._branch = '';
  }

  init() {
    try {
      this.exclude = require(this.excludeFile);
    } catch (err) {
      this.logger.error(err);
    }
    this.checkers = [new LicenseChecker(this.exclude)];
  }

  verify(link) {
    return this._getRepo(link).then(path => {
      let verified = true;
      this.checkers.forEach((checker) => {
        const errors = checker.check(path);
        if (errors.length != 0) {
          errors.forEach((error) => {
            this.logger.error(error.toString());
            verified = false;
          });
        }
      });
      return verified;
    });
  }

  _getRepo(link) {
    const name = this._getLocalPath(link);
    if (this.local && fs.existsSync(name)) {
      return Promise.resolve(name);
    }
    return new Promise((resolve, reject) => {
      const options = {};
      options.path = path.join(process.cwd(), name);
      options.branch = this._branch;
      gitCloneOrPull(link, options, err => {
        if (err) reject(err);
        resolve(name);
      });
    });
  }

  // temp
  _getLocalPath(link) {
    const parsedUrl = url.parse(link);
    return parsedUrl.pathname.substring(1).replace(/\./g, '_').replace(/\//g, '_');
    // need more detailed replace or another way to generate path
  }

  /**
   * @return {{debug(), info(), warning(), error()}}
   */
  get logger() {
    return this._logger || {
        debug: console.log,
        info: console.info,
        warning: console.warning,
        error: console.error
      };
  }

  /**
   * @param {{debug(), info(), warning(), error()}} value
   */
  set logger(value) {
    this._logger = value;
  }

  get local() {
    return this._local;
  }

  set local(value) {
    this._local = value;
  }

  get branch() {
    return this._branch;
  }

  set branch(value) {
    this._branch = value;
  }
  get exclude() {
    return this._exclude;
  }

  set exclude(value) {
    this._exclude = value;
  }

}
module.exports = Verifier;
