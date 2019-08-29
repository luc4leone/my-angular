# “npm run lint” returns an error

I wrote this post here: <https://npm.community/t/npm-run-lint-returns-an-error/9654>

Hello everybody,

hopefully someone can give some hints on how to solve this issue :wink:

First things first, I am on a MAC PRO and my `node` and `npm` versions are:

```bash
[myangular]master$ node -v
v11.10.0
[myangular]master$ npm -v
6.10.3
```

I am using `jshint` to lint my code. I did run:

```bash
npm install --save-dev jshint
```

so now I have my `jshint` module in my `myangular` project. The project structure is:

```text
myangular
  node_modules
  src
    hello.js
  test
  .jshintrc
  package-lock.json
  package.json
```

If you want to see the details you can find it here:

<https://github.com/luc4leone/my-angular>

When I run:

```bash
[myangular]$ ./node_modules/jshint/bin/jshint src
[myangular]master$
```

all goes well. If I have a semicolon syntax error in `hello.js`, I'll get:

```bash
[myangular]master$ ./node_modules/jshint/bin/jshint src
src/hello.js: line 2, col 25, Missing semicolon.

1 error
```

which is perfect. In my `package.json` I have a `lint` script:

```json
{
  "name": "my-own-angularjs",
  "version": "0.1.0",
  "description": "",
  "main": "index.js",
  "directories": {
    "test": "test"
  },
  "scripts": {
    "lint": "jshint src"
  },
  "author": "Luca Leone",
  "license": "MIT",
  "devDependencies": {
    "jshint": "^2.10.2"
  }
}
```

If the semicolon is not missing in `hello.js` when I run:

```bash
[myangular]master$ npm run lint

> my-own-angularjs@0.1.0 lint /Users/luc4leone/myangular
> jshint src
```

But if the semicolon is missing, I'll get:

```bash
[myangular]master$ npm run lint

> my-own-angularjs@0.1.0 lint /Users/luc4leone/myangular
> jshint src

src/hello.js: line 2, col 25, Missing semicolon.

1 error
npm ERR! code ELIFECYCLE
npm ERR! errno 2
npm ERR! my-own-angularjs@0.1.0 lint: `jshint src`
npm ERR! Exit status 2
npm ERR!
npm ERR! Failed at the my-own-angularjs@0.1.0 lint script.
npm ERR! This is probably not a problem with npm. There is likely additional logging output above.

npm ERR! A complete log of this run can be found in:
npm ERR!     /Users/luc4leone/.npm/_logs/2019-08-23T15_48_15_055Z-debug.log
```

And here's the log:

```log
0 info it worked if it ends with ok
1 verbose cli [ '/usr/local/bin/node', '/usr/local/bin/npm', 'run', 'lint' ]
2 info using npm@6.10.3
3 info using node@v11.10.0
4 verbose run-script [ 'prelint', 'lint', 'postlint' ]
5 info lifecycle my-own-angularjs@0.1.0~prelint: my-own-angularjs@0.1.0
6 info lifecycle my-own-angularjs@0.1.0~lint: my-own-angularjs@0.1.0
7 verbose lifecycle my-own-angularjs@0.1.0~lint: unsafe-perm in lifecycle true
8 verbose lifecycle my-own-angularjs@0.1.0~lint: PATH: /usr/local/lib/node_modules/npm/node_modules/npm-lifecycle/node-gyp-bin:/Users/luc4leone/myangular/node_modules/.bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/Users/luc4leone:
9 verbose lifecycle my-own-angularjs@0.1.0~lint: CWD: /Users/luc4leone/myangular
10 silly lifecycle my-own-angularjs@0.1.0~lint: Args: [ '-c', 'jshint src' ]
11 silly lifecycle my-own-angularjs@0.1.0~lint: Returned: code: 2  signal: null
12 info lifecycle my-own-angularjs@0.1.0~lint: Failed to exec lint script
13 verbose stack Error: my-own-angularjs@0.1.0 lint: `jshint src`
13 verbose stack Exit status 2
13 verbose stack     at EventEmitter.<anonymous> (/usr/local/lib/node_modules/npm/node_modules/npm-lifecycle/index.js:326:16)
13 verbose stack     at EventEmitter.emit (events.js:197:13)
13 verbose stack     at ChildProcess.<anonymous> (/usr/local/lib/node_modules/npm/node_modules/npm-lifecycle/lib/spawn.js:55:14)
13 verbose stack     at ChildProcess.emit (events.js:197:13)
13 verbose stack     at maybeClose (internal/child_process.js:984:16)
13 verbose stack     at Process.ChildProcess._handle.onexit (internal/child_process.js:265:5)
14 verbose pkgid my-own-angularjs@0.1.0
15 verbose cwd /Users/luc4leone/myangular
16 verbose Darwin 17.0.0
17 verbose argv "/usr/local/bin/node" "/usr/local/bin/npm" "run" "lint"
18 verbose node v11.10.0
19 verbose npm  v6.10.3
20 error code ELIFECYCLE
21 error errno 2
22 error my-own-angularjs@0.1.0 lint: `jshint src`
22 error Exit status 2
23 error Failed at the my-own-angularjs@0.1.0 lint script.
23 error This is probably not a problem with npm. There is likely additional logging output above.
24 verbose exit [ 2, true ]
```

That means I get an error **only when** there's a syntax problem.**

I checked the environment variables

```bash
[myangular]master$ npm run env | grep "^PATH"
PATH=/usr/local/lib/node_modules/npm/node_modules/npm-lifecycle/node-gyp-bin:/Users/luc4leone/myangular/node_modules/.bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/Users/luc4leone:
```

where I see the correct path to the `jshint` executable.

```text
/Users/luc4leone/myangular/node_modules/.bin
```

I guess `npm` creates the `env` and the `modules/.bin` dir. So everything looks OK, but the issue is there.

## Answer

@shadowspawn  
John Gee  

Most shell commands set the shell exit code (status) when they detect a problem. This is what jshint is doing, and is what I expect when a program like this finds something to report.

npm run displays error information when it detects the exit code was set by the script. Since npm does not know what the script displayed and how clear the failure was, it makes sure you know something went wrong!

When you are running a script and do not want the extra noise, you can use --silent.

```bash
$ npm run lint --silent
src/hello.js: line 2, col 25, Missing semicolon.

1 error
```

You can also suppress the error status code in the script. This may be convenient for scripts you only run manually, but means the script less useful for chaining together commands or failing a build if there are lint problems etc.

```json
"lint": "jshint src || true"
```
