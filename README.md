# Slack ORM

Provides an Object Relationional Model for interfacing with the Slack API.

[![Version][version-image]][version-url]
[![Build Status][build-image]][build-url]
[![Code GPA][quality-image]][quality-url]
[![Coverage Status][coverage-image]][quality-url]
[![Documentation Status][docs-image]][docs-url]
[![Dependency Status][dependency-image]][dependency-url]


## Installation

Add the Slack ORM NPM to your Node.js project:

```bash
npm install slack-orm --save
```


## Usage

Slack-ORM is intended to be used as an Object-Relational Model.  This functionality is still in early stages, with
improvments coming on our path to release 1.0.0.


### Using the Slack REST API Directly

To call the [Slack REST API](https://api.slack.com/methods) directly, you can make use of the API adapter, which
follows a [Promise](http://www.html5rocks.com/en/tutorials/es6/promises/) pattern:

```javascript
var slackORM = require('slack-orm'),
    
    slack = slackORM('my-token-from-slack'),
    
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


### Using the Slack RTM API Directly

Another powerful tool made available by Slack is their [Real Time Messaging API](https://api.slack.com/rtm).  This
allows for applications to listen to events, and make quick, simplified responses through a WebSocket.  Support for
the RTM protocols can be used directly with the `rtm` submodule, which also uses the Promse pattern:

```javascript
var slackORM = require('slack-orm'),
    
    slack = slackORM('my-token-from-slack');


slack.rtm
    .on('connected', function() {
        console.log(">> connected");
    })
    .on('disconnected', function() {
        console.log(">> disconnected");
    })
    .on('pinged', function() {
        console.log(">> pinged");
    })
    .on('ping', function() {
        console.log(">> ping");
    })
    .on('pong', function() {
        console.log(">> pong");
    })
    .on('message', function(response) {
        console.log(">>>> Incoming Message");
        console.log(response);
        console.log("<<<<");
    });


slack.rtm
  .connect()
  .then(function(response) {
    console.log("CONNECTED!");
  });
```

The RTM has a number of custom events that can be listened on:

* `connected` - the RTM service has connected
* `disconnected` - the RTM service has disconnected (either via server disconnect or client)
* `pinged` - the RTM server pinged the client
* `ping` - the client pinged the RTM server
* `pong` - the RTM server replied with a pong
* `socket-error` - error from the socket (first parameter will contain an object describing the error)
* Any of the [Slack Events](https://api.slack.com/rtm#events) that can be fired from the Slack RTM API can also be fired and will contain the response object as the callback's first parameter


Messages can also be sent through the Slack RTM API as defined in
[their documentation](https://api.slack.com/rtm#sending_messages):

```javascript
var slackORM = require('slack-orm'),
    
    slack = slackORM('my-token-from-slack');

slack.rtm
  .connect()
  .then(function(response) {
    
    slack.rtm.send({
      type    : 'message',
      channel : 'C024BE91L',
      text    : 'Hello world'
    });
    
  });
```


## Contributing

There are many ways to contribute to the Slack ORM module!  If you have an idea, or have discovered a bug, please
[Open an Issue](https://github.com/slackrpg/slack-orm/issues) so it can be addressed.

If you're interested in contributing to the project through design or development, please read our
[Contribution Guidelines](https://github.com/slackrpg/slack-orm/blob/master/CONTRIBUTING.md).


## Release Policy

Releases of the Slack ORM module follow [Semantic Versioning](http://semver.org/) standards in a `MAJOR.MINOR.PATCH`
versioning scheme of the following format:

* `MAJOR` - modified when major, incompatible changes are made to the library,
* `MINOR` - modified when functionality is added in a backwards-compatible manner, and
* `PATCH` - patches to existing functionality, such as documentation and bug fixes.


## License

Copyright &copy; 2015 Andrew Vaughan - Released under the [MIT license](LICENSE).




[version-image]:    http://img.shields.io/badge/npm-0.1.0-blue.svg?style=flat
[version-url]:      https://www.npmjs.com/package/slack-orm
[build-url]:        https://travis-ci.org/slackrpg/slack-orm
[build-image]:      https://travis-ci.org/slackrpg/slack-orm.svg?branch=master
[docs-image]:       http://inch-ci.org/github/slackrpg/slack-orm.svg?branch=master
[docs-url]:         http://inch-ci.org/github/slackrpg/slack-orm
[dependency-image]: https://david-dm.org/slackrpg/slack-orm.svg
[dependency-url]:   https://david-dm.org/slackrpg/slack-orm
[coverage-image]:   https://codeclimate.com/github/slackrpg/slack-orm/badges/coverage.svg
[quality-image]:    https://codeclimate.com/github/slackrpg/slack-orm/badges/gpa.svg
[quality-url]:      https://codeclimate.com/github/slackrpg/slack-orm
