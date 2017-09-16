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
const minimatch = require('minimatch');
const colors = require('colors/safe');

const checker = require('./AbstractChecker');

const LICENSE_FILE_PATH = './resources/LICENSE.example';

const TOKENS = {
  END: 'END_OF_LICENSE',
};

class ErrorMessage {

  constructor(message, lineNum, file, checker, linePos = -1) {
    this._line = lineNum;
    this._linePos = linePos;
    this._message = message;
    this._file = file;
    this._checker = checker;
  }

  toString() {
    return colors.red(`${this._checker} Error:
            \t${this._message}
            \tin ${this._file}
            \tat ${this._line}` + (this._linePos === -1 ? '' : `:${this._linePos}`));
  }

  toShortString() {
    return colors.blue(`${this._checker} Error in ${this._file} at ${this._line}` + (this._linePos === -1 ? '' : `:${this._linePos}`));
  }
}

class LicenseChecker extends checker {

  constructor(exclude = null) {
    super();
    this.excludeList = exclude;
    this._extensionsSet = new Set(['.js', '.nut']);
  }


  /**
   * Retrieves the next token (word from the file)
   * @param text to parse
   * @param {Boolean} isCode defines, have license comments in License
   * @return the next token or null, if eof reached
   */
  *_tokensIterator(text, isCode) {
    let pos = 0; // Current global position in the file
    let lineNum = 1;  // Current line number
    let linePos = 0; // Current position in the line
    let res;
    if (isCode) {
      pos = this._skipToLicenseHeader(text);
      pos = this._skipToTextInComments(text, pos);
      if (pos === null) {
        return this._createJsonResponse(TOKENS.END, lineNum, linePos, linePos);
      }
    }
    while (pos < text.length) {
      res = null;
      for (; pos < text.length; pos++) {
        const c = text[pos];

        if (c === '\n') {
          lineNum++;
          linePos = pos;
          if (isCode)  {
            pos = this._skipToTextInComments(text, pos + 1);
            if (pos === null) {
              if (res !== null) {
                yield this._createJsonResponse(res, lineNum, linePos, linePos);
              }
              return this._createJsonResponse(TOKENS.END, lineNum, linePos, linePos);
            }
          }
        }

        if (/\s/.test(c)) {
          if (!res) continue; else break;
        }

        res = res ? res + c : '' + c;
      }

      if (res == null) break; // for cases when \n is the last sym

      yield this._createJsonResponse(res, lineNum, linePos, pos);
    }
    return this._createJsonResponse(TOKENS.END, lineNum, linePos, pos);
  }

  /**
   * Skips all lines that start with '#' and contain only white space characters.
   * Increments the _lineNum counter as necessary.
   * @private
   */
  _skipToLicenseHeader(text) {
    let pos = 0;
    while (pos < text.length) {
      const char = text[pos];
      if (char === '#') {
        pos = this._skipToNextLine(text, pos);
        continue;
      }
      if (!/\s/.test(char)) {
        break;
      }
      pos++;
    }
    return pos;
  }

  _skipToNextLine(text, pos) {
    while (pos < text.length && text[pos] != '\n') {
      pos++;
    }
    if (pos != text.length) pos++;
    return pos;
  }

  _createJsonResponse(token, lineNum, linePos, currentPos) {
    return {
      token: token,
      lineNum: lineNum,
      linePos: currentPos - linePos
    };
  }

  /**
   * Skips to the text after the single line comments ("//") starting from _pos.
   *
   * @private
   * @return offset from the current position (_pos) to the commented text or null if no comments found.
   */
  _skipToTextInComments(text, startPos) {
    if (startPos + 1 >= text.length) return null;
    if (text[startPos] != '/' || text[startPos + 1] != '/') {
      return null;
    } else {
      return startPos + 2;
    }
  }

  /**
   * Check path for License mistakes
   * @param {string} path
   * @return {[ErrorMessage]}
   */
  check(dirpath) {
    const allFiles = this._getFiles(dirpath, []);
    const errors = [];
    errors.push(false); // reserved for LICENSE error
    for (const file of allFiles) {
      const parsedPath = path.parse(file);
      if (this._extensionsSet.has(parsedPath.ext)) {
        errors.push(this._compareWithLicense(file, true));
      } else if (parsedPath.name === 'LICENSE') {
        errors[0] = this._compareWithLicense(file, false); // assign to reserved place
      }
    }
    return errors.filter((error) => error != false);
  }

  _compareWithLicense(filepath, isCode) {
    const checkedLicense = fs.readFileSync(filepath, 'utf-8').replace(/\d\d\d\d(\-\d\d\d\d)?/, '');

    const originalLicense = fs.readFileSync(LICENSE_FILE_PATH, 'utf-8');

    const output = this._compareTwoLicenseTexts(checkedLicense, originalLicense, isCode);
    return output ? new ErrorMessage(output.message, output.lineNum, filepath, 'LicenseChecker', output.linePos) : output;
  }

  _compareTwoLicenseTexts(checkedText, originalText, isCode) {
    const testedGen = this._tokensIterator(checkedText, isCode);
    const goldenGen = this._tokensIterator(originalText, false);

    let checkedToken = testedGen.next().value;
    let originalToken = goldenGen.next().value;
    while ((originalToken.token === checkedToken.token)
           && (checkedToken.token != TOKENS.END) && (originalToken.token != TOKENS.END)) {
      checkedToken = testedGen.next().value;
      originalToken = goldenGen.next().value;
    }

    if (originalToken.token !== checkedToken.token) {
      const message = `Unexpected token "${checkedToken.token}", expected "${originalToken.token}" `;
      return {
        message: message,
        lineNum: checkedToken.lineNum,
        linePos: checkedToken.linePos
      };
    }
    return false;
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

  get excludeList() {
    return this._excludeList;
  }

  /**
   * Construct exclude regexp list from filename
   * @param {JSON} settings for exclude file. '' for default
   */
  set excludeList(settings) {
    if (settings == null) {
      this._excludeList = [];
      return;
    }
    const filenames = settings.LicenseChecker;
    // filters not empty strings, and makes regular expression from template
    const patterns = filenames.map((value) => value.trimLeft()) // trim for "is commented" check
      .filter((value) => (value != '' && value[0] != '#'))
      .map((value) => minimatch.makeRe(value));
    this._excludeList = patterns;
  }

  get extensionsSet() {
    return this._extensionsSet;
  }

  /**
   * @param {Set} set of extensions with leading dot
   */
  set extensionsSet(set) {
    if (set instanceof Set) {
      this._extensionsSet = set;
    } else {
      this.logger.error('Wrong argument type');
    }
  }
}

module.exports.Warning = ErrorMessage;
module.exports = LicenseChecker;
