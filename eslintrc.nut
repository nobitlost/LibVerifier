{
	"env": {
		"es6": true,
		"node": true
	},
	"extends": "eslint:recommended",
	"settings": {
		"parser": "babel-eslint",
		"ecmaFeatures": {
			"classes": true
		}
	},
	"parser": "babel-eslint",
	"parserOptions": {
		"sourceType": "module",
		"allowImportExportEverywhere": false,
		"codeFrame": false
	},
	"plugins": ["squirrel"],
	"rules": {
		"squirrel/ei-license": [2, "./LICENSE"],
		"squirrel/ei-version": 1,
		"squirrel/ei-require": 2,
		"indent": [
			"error",
			4
		],
		"linebreak-style": [
			"error",
			"unix"
		],
		"quotes": [
			"error",
			"double"
		],
		"semi": [
			"error",
			"always"
		]
	}
}
