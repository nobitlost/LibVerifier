# LibVerifier

LibVerifier is a Javascript (Node.js) tool designed to simplify and automate validation of third-party libraries for Electric Imp modules.

Any third-party code submitted as a library candidate must conform to [Third-Party Library Submission Guidelines](https://electricimp.com/docs/libraries/submissions/). This tool is intended to make the checks like: coding style, license file presence and format, source file copyrights presence and format, tests and examples, file names correctness, etc.
The tool may be used as by a third-party library provider (to verify the guidelines conformance before the library submission), as well as by Electric Imp (to verify the guidelines conformance during the submission review).

## Supported Checkers

The tool has extendable architecture and consists of the main framework and plug-able *Checkers* which make particular verification.

The current version of the tool supports the following *Checkers*:

- **LicenseChecker**: checks that all the source files in JavaScript and Squirrel languages have proper license headers and the LICENSE file exists and is correct.

## Installation 

To use the tool you need to have [Node.js and npm](https://www.npmjs.com/get-npm) installed.

1. Clone this repository to your local filesystem. For example: 
```
git clone https://github.com/nobitlost/LibVerifier.git LibVerifier
```
2. Goto the directory with the cloned repository.
3. Run 
```npm install```

## Usage

In the directory with the cloned repository run:  
```
node src/cli.js [<options>] <path>
``` 
where
- *\<path>* is a path to the directory with the code that should be verified;  
- *\<options>* are:

```
--exclude-file <file>  specify file with exclude list
-v, --version          output the version number
-h, --help             output usage information
```

The tool runs all *Checkers* against the code in the specified directory. When all the checks are done the results of the verification are printed in the console.

## Exclude List

You can specify a file with exclude list by using the `--exclude-file` option.

Exclude file is a JSON document that contains a list of exclude rules for each of the *Checkers*. Wildcards are supported for
exclude entry values.

**Example**

This exclude list excludes all files in the `node_modules` directory and in the `test*` and `spec` directories and their sub-directories from a verification by *LicenseChecker*.

```
{
  "LicenseChecker" : [
    "**/node_modules",
    "**/test*/**",
    "**/spec/**"
  ]
}
```

## License

The tool is distributed under the [MIT License](./LICENSE).
