// Copyright (c) 2017 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

const gitCloneOrPull = require('git-clone-or-pull');
const path = require('path');
const fs = require('fs');
const url = require('url');

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
      gitCloneOrPull(link, path.join(process.cwd(), name), err => {
        if (err) reject(err);
        resolve(name);
      });
    });
  }

  // temp
  _getLocalPath(link) {
    const parsedUrl = url.parse(link);
    return parsedUrl.pathname.substring(1).replace('.', '_').replace('/', '_');
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

  get exclude() {
    return this._exclude;
  }

  set exclude(value) {
    this._exclude = value;
  }

}
module.exports = Verifier;
