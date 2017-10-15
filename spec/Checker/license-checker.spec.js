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

const LicenseChecker = require('../../src/Checkers/LicenseChecker.js');


describe('LicenseChecker', () => {
    let licenseChecker;
    let checkedFiles;

    const getFilesCount = function (dirPath) {
        const files = fs.readdirSync(dirPath);
        files.forEach((checkedFile) => {
            checkedFiles.add(path.normalize(dirPath + path.sep + checkedFile));
        });
        return files.length;
    };

    const printMessages = function (passedFiles, errors, isValid) {
        const messageForPassed = isValid ? colors.green('[OK]') : colors.red('[ERROR]');
        const messageForErrors = isValid ? colors.red('[ERROR]') : colors.green('[OK]');
        passedFiles.forEach((file) => {
            console.log(file + ' ' + messageForPassed);
        });
        errors.forEach((errorMessage) => {
            if (errorMessage._file != null) {
                console.log(path.normalize(errorMessage._file) + ' ' + messageForErrors);
            } else {
                console.log(`Can\'t find attribute "_file" in ${errorMessage}`);
            }
        });
    };

    beforeEach(() => {
        licenseChecker = new LicenseChecker();
        checkedFiles = new Set();
    });

    it('should get ErrorMessages, when check wrong license', () => {
        const pathWithWrongLics = './spec/fixtures/wrongLicenses';
        const res = licenseChecker.check(pathWithWrongLics);
        // all licenses in file with mistake
        expect(res.length).toEqual(getFilesCount(pathWithWrongLics));
        res.forEach((error) => {
            checkedFiles.delete(path.normalize(error._file));
        });
        printMessages(checkedFiles, res, false);
        // console.log(res); // to check what is wrong
    });

    it('shouldn\'t get ErrorMessages, when check right license', () => {
        const pathWithRightLics = './spec/fixtures/rightLicenses';
        const res = licenseChecker.check(pathWithRightLics);
        getFilesCount(pathWithRightLics);
        res.forEach((error) => {
            checkedFiles.delete(path.normalize(error._file));
        });
        // all licenses in file is correct
        expect(res.length).toEqual(0);
        printMessages(checkedFiles, res, true);
    });

});
