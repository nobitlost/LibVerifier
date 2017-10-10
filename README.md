# LibVerifier

Tool is designed to simplify and automate validation process for Electric Imp libraries and integrations submitted for review by 3d parties. The goal is to formalize and automate the manual work that needs to be done to make sure that libraries in question conform to [Third-Party Library Submission Guidelines](https://electricimp.com/docs/libraries/submissions/): coding style, license file and source file copyright headers formats, tests and examples verification.

## Rules
There are rules, that should be checked by LibVerifier. The list of rules with checker which verify them respectively is presented below.

1) LicenseChecker - All the source files in JavaScript and Squirrel languages have proper license headers and the LICENSE file exists and is correct.

## Installation 

To use the tool you need to have [npm](https://www.npmjs.com/get-npm) installed.

1. Clone repo to your filesystem and change to it: 
```
git clone https://github.com/nobitlost/LibVerifier.git LibVerifier; cd LibVerifier
```
2. Run `npm install`

## Usage

To run check a project located at the `<path>` specified, use the command:  
```
node src/cli.js [options] <path>
``` 
where options are: 

```
-v, --version          output the version number
--exclude-file <file>  specify file with exclude list
-h, --help             output usage information
```

## Exclude

You can specify a file with exclude list by using the `--exclude-file` option.

Exclude file is JSON document, that contains a list of exclude rules for each of the Checkers
(only `LicenseChecker` checker is supported in this version). Wildcards are supported for
exclude entry values.

**Example**

Exclude files from the `node_modules`, `test*` and `spec` directories and subdirectories:

```
{
  "LicenseChecker" : [
    "**/node_modules",
    "**/test*/**",
    "**/spec/**"
  ]
}
```

## How it works

`LibVerifier` runs all the defiled checkers in specified folder. When all the checks are done
test results are printed in the console.

## License

The tool is distributed under the [MIT License](./LICENSE).
