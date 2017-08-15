// Copyright (c) 2017 Electric Imp
// This file is licensed under the MIT License
// http://opensource.org/licenses/MIT

'use strict';


const fs = require('fs');
const path = require('path');
const minimatch = require('minimatch');

const AbstractChecker = require('./AbstractChecker');
const CheckerWarning = AbstractChecker.Warning;

const LICENSE_PATH = './license.txt';
const LICENSE_FILE_PATH = './LICENSE.example';


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
    return errors.filter((error) => error != null);
  }

  _checkLicenseFile(filepath) {
    const content = fs.readFileSync(filepath, 'utf-8');
    const originalLicense = fs.readFileSync(LICENSE_FILE_PATH, 'utf-8');
    const checkedLicense = content.replace(/\d\d\d\d(\-\d\d\d\d)?/, '');
    return this._compareLicenses(checkedLicense, originalLicense);
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
      lines[i] = lines[i].trim();

      if (commentsType == '') {

        if (lines[i] == '' || lines[i].startsWith('#!')) {
          offset++;
          continue;
        } // skip empty and shebang strings

        if (lines[i].startsWith('//')) {
          commentsType = '//';
          licenseLines.push(lines[i].substring(2).trim());
        } else if (lines[i].startsWith('/*')) {
          commentsType = '/*';
          licenseLines.push(lines[i].substring(2).trim());
        } else {
          return new LicenseCheckerWarning('License should be in header', i + 1, filepath);
        }

      } else if (commentsType = '//') {

        if (lines[i].startsWith('//')) {
          licenseLines.push(lines[i].substring(2).trim());
        } else {
          break; // end
        }

      } else if (commentsType = '/*') {

        let index;
        if (index = lines[i].indexOf('*/') > -1) {
          licenseLines.push(lines[i].substring(0, index).trim());
          break;
        }
        if (lines[i].startsWith('*')) {
          lines[i] = lines[i].substring(1).trim();
        }
        licenseLines.push(lines[i]);

      }
    }
    const checkedLicense = licenseLines.reduce((prev, curr) => prev + '\n' + curr);
    const output = this._compareWithLicense(checkedLicense, offset);

    if (output) {
      return new LicenseCheckerWarning(output.message, offset + output.line, filepath, output.symbol);
    }

    return null;
  }

  _compareWithLicense(checkedLicense) {
    const originalLicense = fs.readFileSync(LICENSE_PATH, 'utf-8');
    checkedLicense = checkedLicense.replace(/\d\d\d\d(\-\d\d\d\d)?/, '');
    return this._compareLicenses(checkedLicense, originalLicense);
  }

  _compareLicenses(checkedLicense, originalLicense) {
    let checkedLicIndex = 0;
    let originalLicIndex = 0;
    let lineNum = 1;
    let lastLB = 0;
    for (; (checkedLicIndex < checkedLicense.length) && (originalLicIndex < originalLicense.length); checkedLicIndex++, originalLicIndex++) {

      while ( (checkedLicIndex < checkedLicense.length) && (/\s/.test(checkedLicense[checkedLicIndex]))) {
        if (checkedLicense[checkedLicIndex] == '\n') {
          lineNum++;
          lastLB = checkedLicIndex;
        }
        checkedLicIndex++;
      }

      while ( (originalLicIndex < originalLicense.length) && (/\s/.test(originalLicense[originalLicIndex]))) {
        originalLicIndex++;
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
    return null;
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
      if (!this._isExclude(files[i])) {
        const name = dir + '/' + files[i];
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
