# LibVerifier
Electric Imp tool for 3'd party library validation.

## Installation 
You need to have `npm` installed.
1. Clone repo to your filesystem and change to it
2. Run `npm install`

## Usage
Run `src/cli.js [options] <path>` to validate all files in `<path>`.

```
Options:
 -h, --help       Show help.
 --exclude-file   Specify file, that contains excludes.   [string]
```

## Exclude
You can specify your own exclude file with `--exclude-file` option.

Exclude file is **JSON**, that contains Checker names as fields. Each checker corresponds to array, that contains wildcards of filenames, which current checker will ignore. 
For example:
```
{
  "LicenseChecker" : [
    "**/node_modules",
    "**/test*/**",
    "**/spec/**"
  ]
}
```
This exclude `node_modules` and `test` files from the check.

## Workflow
**LibVerifier** run all checkers on test folder. When all checks are done all failed cases will be written in console.




