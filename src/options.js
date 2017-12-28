var eslint = require('eslint')
var path = require('path')
var pkg = require('../package.json')

module.exports = {
  bugs: pkg.bugs.url,
  cmd: 'standard',
  eslint: eslint,
  eslintConfig: {
    configFile: path.join(__dirname, '../eslintrc.nut.json'),
    useEslintrc: true,
    plugins: ["babel", "squirrel"],
    parser: "babel-eslint",
    fix: true
  },
  homepage: pkg.homepage,
  tagline: 'Use JavaScript Standard Style',
  version: pkg.version
}
