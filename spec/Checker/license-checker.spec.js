// MIT License
//
// Copyright 2017 ElectricImp
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
const TEST_DIR_PATH = './spec/fixtures/wrongLicenses/';

const LicenseChecker = require('../../src/Checkers/LicenseChecker.js');


describe('LicenseChecker', () => {
  let licenseChecker;
  const getFilesCount = function (dirPath) {
    const files = fs.readdirSync(dirPath);
    return files.length;
  };

  beforeEach(() => {
    licenseChecker = new LicenseChecker();
  });

  it('should get ErrorMessages, when check wrong license', () => {
    const res = licenseChecker.check(TEST_DIR_PATH);
    // all licenses in file with mistake
    expect(res.length).toEqual(getFilesCount(TEST_DIR_PATH));
    console.log(res);
  });

});
