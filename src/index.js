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
const colors = require('colors/safe');

const LicenseChecker = require('./Checkers/LicenseChecker');
const DEFAULT_EXCLUDE = '../excludes.json';

/**
 * Main Verifier class
 */
class Verifier {

    constructor(excludeFile = null) {
        if (excludeFile === null) {
            this.excludeFile = DEFAULT_EXCLUDE;
        } else {
            this.excludeFile = excludeFile;
        }

        this._exclude = null;
        try {
            this._exclude = require(this.excludeFile);
        } catch (err) {
            if (excludeFile != DEFAULT_EXCLUDE) {
                this.logger.error(err);
            }
        }
        this.checkers = [new LicenseChecker(this._exclude)];
    }

    /**
     * @param folderpath folder, where project is placed
     * @return {Promise}
     */
    verify(folderpath) {

        const absolutePath = path.resolve(folderpath); // needs for correct excludes
        if (!fs.existsSync(absolutePath)) {
            throw new Error('Path does not exist');
        }
        const checkersErrors = [];
        let verified = true;

        this.checkers.forEach((checker) => {
            const errors = checker.check(absolutePath);
            if (errors.length != 0) {
                checkersErrors.push(errors);
                errors.forEach((error) => {
                    if (verified) this.logger.error('1) All files with errors:');
                    this.logger.error(error.toShortString());
                    // prepare to print short error messages
                    verified = false;
                });
            }
        });

        return this._createResponse(verified, checkersErrors);

    }

    _createResponse(verified, checkersErrors) {
        if (verified) {
            this.logger.info(colors.green('Checks PASSED'));
            return false;
        }

        this.logger.error('2) Detailed errors:');

        checkersErrors.forEach((listOfCheckerErr) => {
            listOfCheckerErr.forEach((error) => {
                this.logger.error(error.toString());
            });
        });
        this.logger.error(colors.red('Checks FAILED'));
        return true;
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

    get exclude() {
        return this._exclude;
    }

    set exclude(value) {
        this._exclude = value;
    }

}

module.exports = Verifier;
