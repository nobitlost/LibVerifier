# LibVerifier
Electric Imp tool for 3'd party library validation.

## Installation 
You need to have `npm` installed.
1. Clone repo to your filesystem and change to it
2. Run `npm install`

## Usage
Run `src/cli.js [options] <github-path>` to check, if all files in `<github-path>` can pass all checks.

```
Options:
 -h, --help       Show help.
 -l, --local      Don't push before every run. 
 -b, --branch     Use another branch.                     [string]
 --exclude-file   Specify file, that contains excludes.   [string]
```

## Exclude
You can specify your own exclude file with `--exclude-file` option.

Exclude file is **JSON**, that contains Checker names and arrays, with wildcard patterns, that current checker will ignore. 
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
This config will ignore `node_modules` and `test` files.

## Workflow
For the first run **LibVerifier** clone specified repository to the folder, whose name depends on the name of the repository. When all checks are done all failed cases will be written in console.

```
Note:
 LibVerifier will pull repo before every run without --local option
``` 


