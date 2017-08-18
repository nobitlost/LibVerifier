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


const fs = require('fs');
const path = require('path');
const minimatch = require('minimatch');

const AbstractChecker = require('./AbstractChecker');
const CheckerWarning = AbstractChecker.Warning;

const LICENSE_FILE_PATH = './resources/LICENSE.example';


class LicenseCheckerWarning extends CheckerWarning {

  constructor(message, line, file, sym = -1) {
    super(message, line, file, 'LicenseChecker', sym);
  }

  toString() {
    return super.toString();
  }
};

class LicenseChecker extends AbstractChecker {

  constructor(exclude) {
    super();
    this.excludeList = exclude;
    this._extensionsSet = new Set(['.js', '.nut']);
  }

  /**
   * Check path for License mistakes
   * @param {string} path
   * @return {[CheckerWarning]}
   */
  check(dirpath) {
    const files = this._getFiles(dirpath, []);
    const errors = [];
    for (const i in files) {
      const parsedPath = path.parse(files[i]);
      if (this._extensionsSet.has(parsedPath.ext)) {
        errors.push(this._checkSourceFile(files[i]));
      } else if (parsedPath.name == 'LICENSE') {
        errors.push(this._checkLicenseFile(files[i]));
      }
    }
    return errors.filter((error) => error != false);
  }

  _checkLicenseFile(filepath) {
    const content = fs.readFileSync(filepath, 'utf-8');
    const output = this._compareWithLicense(content);
    return output ? new LicenseCheckerWarning(output.message, output.line, filepath) : output;
  }

  _checkSourceFile(filepath) {
    const content = fs.readFileSync(filepath, 'utf-8');
    const lines = content.split(/\n/);
    if (!lines) {
      return new LicenseCheckerWarning('File have not License Header', 0, filepath);
    }

    const licenseLines = [];
    let commentsType = '';
    let offset = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

       if (line == '') {
          offset++;
          continue;
        } // skip empty strings

      if (commentsType == '') {

        if (line.startsWith('#!')) {
          offset++;
          continue;
        } // skip shebang strings

        if (line.startsWith('//')) {
          commentsType = '//';
          licenseLines.push(line.substring(2).trim());
        } else if (line.startsWith('/*')) {
          commentsType = '/*';
          licenseLines.push(line.substring(2).trim());
        } else {
          return new LicenseCheckerWarning('License should be in header', i + 1, filepath);
        }

      } else if (commentsType = '//') {

        if (line.startsWith('//')) {
          licenseLines.push(line.substring(2).trim());
        } else {
          break; // end
        }

      } else if (commentsType = '/*') {

        let index;
        if (index = line.indexOf('*/') > -1) {
          licenseLines.push(line.substring(0, index).trim());
          break;
        }
        if (line.startsWith('*')) {
          line = line.substring(1).trim();
        }
        licenseLines.push(line);

      }
    }
    const checkedLicense = licenseLines.reduce((prev, curr) => prev + '\n' + curr);
    const output = this._compareWithLicense(checkedLicense, offset);

    if (output) {
      return new LicenseCheckerWarning(output.message, offset + output.line, filepath, output.symbol);
    }

    return false;
  }

  _compareWithLicense(checkedLicense) {
    const originalLicense = fs.readFileSync(LICENSE_FILE_PATH, 'utf-8');
    checkedLicense = checkedLicense.replace(/\d\d\d\d(\-\d\d\d\d)?/, '');
    return this._compareLicenses(checkedLicense, originalLicense);
  }

  _compareLicenses(checkedLicense, originalLicense) {
    let checkedLicIndex = 0;
    let originalLicIndex = 0;
    let lineNum = 1;
    let lastLB = 0;

    for (; (checkedLicIndex < checkedLicense.length) && (originalLicIndex < originalLicense.length); checkedLicIndex++, originalLicIndex++) {
      let checkedSpace = false;
      let originalSpace = false;
      while ( (checkedLicIndex < checkedLicense.length) && (/\s/.test(checkedLicense[checkedLicIndex]))) {
        if (checkedLicense[checkedLicIndex] == '\n') {
          lineNum++;
          lastLB = checkedLicIndex;
        }
        checkedSpace = true;
        checkedLicIndex++;
      }

      while ( (originalLicIndex < originalLicense.length) && (/\s/.test(originalLicense[originalLicIndex]))) {
        originalSpace = true;
        originalLicIndex++;
      }

      if (originalSpace != checkedSpace) {
        let message = '';
        if (originalSpace) {
          message = 'missing space in license';
        } else {
          message = 'extra space in license';
        }
       return {
          message : message,
          line : lineNum,
          symbol :checkedLicIndex - lastLB - 1
        };
      }

      if (checkedLicense[checkedLicIndex] != originalLicense[originalLicIndex]) {
        const firstWord = this._findNearestWord(checkedLicense, checkedLicIndex);
        const secondWord = this._findNearestWord(originalLicense, originalLicIndex);
        return {
          message : `expected "${secondWord}", but find "${firstWord}" in license header`,
          line : lineNum,
          symbol :checkedLicIndex - lastLB
        };
      }

    }
    let tail;
    if (tail = this._isStringHasEnd(checkedLicense, checkedLicIndex)) {
      return {
        message : `unexpected end of license "${tail}"`,
        line : checkedLicIndex - lastLB
      };
    }
    if (tail = this._isStringHasEnd(originalLicense, originalLicIndex)) {
      return {
        message : `missing end of license "${tail}"`,
        line : checkedLicIndex - lastLB
      };
    }
    return false;
  }

  _isStringHasEnd(str, index) {
    const endOfString = str.substring(index);
    if (!/^(\s+)?$/.test(endOfString)) {
      return endOfString;
    }
    return false;
  }

  _findNearestWord(str, position) {
    const end = (position) + str.substring(position).search(/\s/);
    while (!/\s/.test(str[position - 1]) && position > 0) {
      position--;
    }
    return str.substring(position, end == -1 ? str.length : end);
  }

  _isExclude(filepath) {
    return this._excludeList.some((regexp) => regexp.test(filepath));
  }

  _getFiles(dir, allFiles) {
    const files = fs.readdirSync(dir);
    for (const i in files) {
      const name = dir + '/' + files[i];
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

  get excludeList() {
    return this._excludeList;
  }

  /**
   * Construct exclude regexp list from filename
   * @param {JSON} settings for exclude file. '' for default
   */
  set excludeList(settings) {
    const filenames = settings.LicenseChecker;
    // filters not empty strings, and makes regular expression from template
    const patterns = filenames.map((value) => value.trimLeft()) // trim for "is commented" check
      .filter((value) => (value != '' && value[0] != '#'))
      .map((value) => minimatch.makeRe(value));
    this._excludeList = patterns;
  }

}


module.exports.Warning = LicenseCheckerWarning;
module.exports  = LicenseChecker;
