# Slack ORM

Provides an Object Relationional Model for interfacing with the Slack API.

[![Version][version-image]][version-url]
[![Build Status][build-image]][build-url]
[![Code GPA][quality-image]][quality-url]
[![Coverage Status][coverage-image]][quality-url]
[![Documentation Status][docs-image]][docs-url]
[![Dependency Status][dependency-image]][dependency-url]


### Usage

Add the Slack ORM NPM to your Node.js project:

```bash
npm install slack-orm --save
```

To call the [Slack REST API](https://api.slack.com/methods) directly, you can make use of the API adapter, which
follows a [Promise](http://www.html5rocks.com/en/tutorials/es6/promises/) pattern:

```javascript
var SlackORM = require('slack-orm'),
    
    slack = new SlackORM('my-token-from-slack'),
    
    params = {
        foo : 'bar'
    };

slack.api
    .call('api.test', params)
    .then(function(response) {
        console.log("Slack OK: ", response.ok ? "YES" : "NO");
        console.log("Foo: ", response.args.foo);
    })
    .catch(function(err) {
        console.warn("Slack Error: ", err);
    });
```


### Contributing

There are many ways to contribute to the Slack ORM module!  If you have an idea, or have discovered a bug, please
[Open an Issue](https://github.com/slackrpg/slack-orm/issues) so it can be addressed.

If you're interested in contributing to the project through design or development, please read our
[Contribution Guidelines](https://github.com/slackrpg/slack-orm/blob/master/CONTRIBUTING.md).


### Release Policy

Releases of the Slack ORM module follow [Semantic Versioning](http://semver.org/) standards in a `MAJOR.MINOR.PATCH`
versioning scheme of the following format:

* `MAJOR` - modified when major, incompatible changes are made to the library,
* `MINOR` - modified when functionality is added in a backwards-compatible mannder, and
* `PATCH` - patches to existing functionality, such as documentation and bug fixes.


### License

Copyright &copy; 2015 Andrew Vaughan - Released under the [MIT license](LICENSE).




[version-image]:    http://img.shields.io/badge/version-0.0.0-blue.svg?style=flat
[version-url]:      https://github.com/slackrpg/slack-orm/releases
[build-url]:        https://travis-ci.org/slackrpg/slack-orm
[build-image]:      https://travis-ci.org/slackrpg/slack-orm.svg?branch=master
[docs-image]:       http://inch-ci.org/github/slackrpg/slack-orm.svg?branch=master
[docs-url]:         http://inch-ci.org/github/slackrpg/slack-orm
[dependency-image]: https://david-dm.org/slackrpg/slack-orm.svg
[dependency-url]:   https://david-dm.org/slackrpg/slack-orm
[coverage-image]:   https://codeclimate.com/github/slackrpg/slack-orm/badges/coverage.svg
[quality-image]:    https://codeclimate.com/github/slackrpg/slack-orm/badges/gpa.svg
[quality-url]:      https://codeclimate.com/github/slackrpg/slack-orm
