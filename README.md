# LibVerifier

Electric Imp tool for 3'd party library verification.

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
 --exclude-file <path-to-exclude-file>   Specifies the exclude list
 -v, --version                           Prints the tool version
 -h, --help                              Prints this help message
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
