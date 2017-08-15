// Copyright (c) 2017 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';

const Errors = {};

Errors.LicenseCheckerError = class LicenseCheckerError extends Error {
};
class CheckerWarning {
   constructor(message, line, file, checker, sym = -1) {
    this._line = line;
    this._sym = sym;
    this._message = message;
    this._file = file;
    this._checker = checker;
  }

  toString() {
    return `${this._checker} Error:
            \t${this._message}
            \tin ${this._file}
            \tat line:${this._line}` + (this._sym == -1 ? '' : ` sym:${this._sym}`);
  }
}
class AbstractChecker {

  /**
   * Check path
   * @param {string} path
   * @return {string}
   */
  check(path) {
  }

  /**
   * @return {{debug(),info(),warning(),error()}}
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
   * @param {{debug(),info(),warning(),error()}} value
   */
  set logger(value) {
    this._logger = value;
  }
}

module.exports = AbstractChecker;
module.exports.Warning = CheckerWarning;
