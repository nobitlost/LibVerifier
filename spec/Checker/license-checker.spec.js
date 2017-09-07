// Copyright (c) 2016-2017 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

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
