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
        return colors.red(`${this._checker} Error:`) + '\n' +
            `\t${this._message}` + '\n' +
            colors.red('\tin ') + this._file + '\n' +
            colors.red('\tat ') + `${this._line}` + (this._linePos === -1 ? '' : `:${this._linePos}`);
    }

    toShortString() {
        return colors.blue(`${this._checker} Error in `) + this._file + colors.blue(` at ${this._line}` + (this._linePos === -1 ? '' : `:${this._linePos}`));
    }
}

class LicenseChecker extends checker {
    constructor(exclude = null) {
        super();
        this.excludeList = exclude;
        this._extensionSet = new Set(['.js', '.nut']);
    }

    /**
     * Retrieves a next token (word) from the specified text
     * @param text to parse
     * @param {Boolean} parseSourceComments true if the license text
     * is supposed to be commented out (source file header) or uncommented (LICENSE file)
     * @private
     * @return the next token or null, if eof reached
     */
    * _tokensIterator(text, parseSourceComments) {
        let pos = 0; // Current global position in the file
        let lineNum = 1;  // Current line number
        let linePos = 0; // Current position in the line
        let res;
        if (parseSourceComments) {
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
                    if (parseSourceComments) {
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
            if (res === null) break; // for cases when \n is the last sym
            yield this._createJsonResponse(res, lineNum, linePos, pos);
        }
        return this._createJsonResponse(TOKENS.END, lineNum, linePos, pos);
    }

    /**
     * Skips all lines that start with '#' and contain only white space characters.
     * @private
     * @return {Integer} position
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

    /**
     * Skips to the next line.
     * @private
     * @return {integer} position
     */
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
     * @param {String} path
     * @return {[ErrorMessage]}
     */
    check(dirpath) {
        const allFiles = this._getFiles(dirpath, []);
        const errors = [];
        errors.push(false); // reserved for LICENSE error
        for (const file of allFiles) {
            const parsedPath = path.parse(file);
            if (this._extensionSet.has(parsedPath.ext)) {
                errors.push(this._compareWithLicense(file, true));
            } else if (parsedPath.name === 'LICENSE') {
                errors[0] = this._compareWithLicense(file, false); // assign to reserved place
            }
        }
        return errors.filter((error) => error != false);
    }

    /**
     * Check path for License mistakes
     * @param {String} filepath path to file
     * @param {Boolean} parseSourceComments true if the license text
     * is supposed to be commented out (source file header) or uncommented (LICENSE file)
     * @private
     * @return {ErrorMessage}
     */
    _compareWithLicense(filepath, parseSourceComments) {
        const yearRegexp = /\d\d\d\d(\-\d\d\d\d)?/;

        let testedLicense = fs.readFileSync(filepath, 'utf-8');
        testedLicense = this._delete3dPartyCopyright(testedLicense).replace(yearRegexp, '');
        const goldenLicense = fs.readFileSync(LICENSE_FILE_PATH, 'utf-8');

        const output = this._compareTwoLicenseTexts(testedLicense, goldenLicense, parseSourceComments);
        return output ? new ErrorMessage(output.message, output.lineNum, filepath, 'LicenseChecker', output.linePos) : output;
    }

    /**
     * Delete third-party copyright in license
     * @param {String} license text of license
     * @private
     * @return {String} new license
     */
    _delete3dPartyCopyright(license) {
        /* regexp match example:
         * "// Copyright 2017 company name\n"
         * "Copyright 2016 companyName\r\n"
         */
        const copyrightStringRegexp = /(\/\/\s?)?Copyright\s+\d\d\d\d(\-\d\d\d\d)?\s+(.*)(\r)?\n/g;
        return license.replace(copyrightStringRegexp, (str, p1, p2, p3) => {
                return p3 === 'Electric Imp' ? str : '';
        });
    }

    /**
     * Compare two licenses for equality
     *
     * @param {String} testedText text of license or code
     * @param {String} goldenText original license
     * @param {Boolean} parseSourceComments true if the license text
     * is supposed to be commented out (source file header) or uncommented (LICENSE file)
     * @private
     * @return {false | MessageJson} false if licenses are equal, message with differs otherwise
     */
    _compareTwoLicenseTexts(testedText, goldenText, parseSourceComments) {
        const testedGen = this._tokensIterator(testedText, parseSourceComments);
        const goldenGen = this._tokensIterator(goldenText, false);

        let testedToken = testedGen.next().value;
        let goldenToken = goldenGen.next().value;

        while ((goldenToken.token === testedToken.token)
              && (testedToken.token !== TOKENS.END) && (goldenToken.token !== TOKENS.END)) {
            testedToken = testedGen.next().value;
            goldenToken = goldenGen.next().value;
        }

        if (goldenToken.token !== testedToken.token) {
            let message;
            if (testedToken.token == TOKENS.END) {
                message = colors.red('Unexpected end of license instead of "')
                    + goldenToken.token
                    + colors.red('". The License text should precede any other statements in the file (except for shebang).');
            } else {
                message = colors.red('Unexpected token "') + testedToken.token + colors.red('" instead of "')
                    + goldenToken.token + colors.red('"');
            }

            return {
                message: message,
                lineNum: testedToken.lineNum,
                linePos: testedToken.linePos
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
        if (settings === null) {
            this._excludeList = [];
            return;
        }
        const filenames = settings.LicenseChecker;
        // filters not empty strings, and makes regular expression from template
        this._excludeList = filenames.map((value) => value.trimLeft()) // trim for "is commented" check
            .filter((value) => (value !== '' && value[0] !== '#'))
            .map((value) => minimatch.makeRe(value));
    }

    get extensionSet() {
        return this._extensionSet;
    }

    /**
     * @param {Set} set of extensions with leading dot
     */
    set extensionSet(set) {
        if (set instanceof Set) {
            this._extensionSet = set;
        } else {
            this.logger.error('Wrong argument type');
        }
    }
}

module.exports.Warning = ErrorMessage;
module.exports = LicenseChecker;
