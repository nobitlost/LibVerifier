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

'use-strict';

const colors = require('colors/safe');

function buildMessage(stringTemplate, substitutions, mainColor = 'white') {
  const messageObject = { str : stringTemplate,
                          color : mainColor
                        };
  const messageParts = [messageObject];
  substitutions.forEach((element) => {
    for (let i = 0; i < messageParts.length; i++) {
      const newElems = messageParts[i].str.split(element[0]);
      const color = messageParts[i].color;
      if (newElems.length != 1) {
        const leftMessageObj = { str : newElems[0],
                                 color : color
                               };
        const midMessageObj = { str : element[1].toString(), // toString avoid unexpected casts
                                color : element[2]
                              };
        const rightMessageObj = { str : newElems[1],
                                  color : color
                                };
        messageParts.splice(i, 1, leftMessageObj, midMessageObj,  rightMessageObj);
      }
    }
  });
  return messageParts.map((part) => {
    return colors[part.color](part.str);
  }).join('');
}


module.exports.buildMessage = buildMessage;
