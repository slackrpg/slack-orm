var util = require('util'),

    EventEmitter = require('events'),
    Promise = require('bluebird'),
    WebSocket = require('ws'),
    UUID = require('uuid'),
    
    SlackError = require('../error/SlackError'),
    RequestError = require('../error/RequestError');


/**
 * Creates an interface to API calls made over RTM via WebSocket.
 *
 * @param {RestAPI} api - a connected API service to Slack
 *
 * @fires RTM#connected
 * @fires RTM#disconnected
 * @fires RTM#pinged
 * @fires RTM#ping
 * @fires RTM#pong
 * @fires RTM#socket-error
 * @fires RTM#response
 * @fires RTM#SlackEvent
 *
 * @see https://api.slack.com/rtm
 * @see https://api.slack.com/events
 */
function RTM(api) {
    
    /**
     * The API adapter to use to connect to RTM.
     * @var {RestAPI} api */
    this.api = api;
    
    
    /**
     * The websocket we communicate to the RTM API with.
     * @var {WebSocket} ws
     */
    this.websocket = null;
    
    
    /**
     * Whether we are currently connected to the RTM API.
     * @var {boolean} connected
     */
    this.connected = false;
    
    
    /**
     * The timeout functionality for pinging the server.
     * @var {Object} ping
     */
    this.ping = {
        last     : 0,
        interval : null
    };
    
    
    // Set the client up to emit events
    EventEmitter.call(this);
    
}

util.inherits(RTM, EventEmitter);


/**
 * Connects to the Slack service and begins listening for events.
 *
 * @returns {boolean} the response object if a connection was made, false if already connected
 * @api public
 */
RTM.prototype.connect = Promise.method(function() {
    
    var self = this;
    
    return new Promise(function(resolve, reject) {
        
        if (!self.connected) {
            
            self.api
                .call('rtm.start')
                .then(function(response) {
                    
                    self.websocket = new WebSocket(response.url);
                    
                    // Resolve our state when the connection is established
                    self.websocket.on('open', function() {
                        
                        self.connected = true;
                        self.ping.last = Date.now();
                        
                        // If we've gone 5+ seconds without interaction, send a ping
                        self.ping.interval = setInterval(function() {
                            
                            if (self.ping.last <= Date.now() + 5000) {
                                self.websocket.ping();
                                
                                /**
                                 * Ping event fired when the client pings the server.
                                 *
                                 * @event RTM#ping
                                 */
                                self.emit('ping');
                            }
                            
                        }, 5000);
                        
                        /**
                         * Connected event fired when connected to the RTM API.
                         *
                         * @event RTM#connected
                         */
                        self.emit('connected');
                        
                        resolve(response);
                        
                    });
                    
                    // Handle server pings
                    self.websocket.on('ping', function(data, flags) {
                        
                        self.websocket.pong();
                        self.ping.last = Date.now();
                        
                        /**
                         * Pinged event fired when a ping request has come in from the server.
                         *
                         * @event RTM#pinged
                         */
                        self.emit('pinged');
                        
                    });
                    
                    // Handle server pongs
                    self.websocket.on('pong', function() {
                        
                        /**
                         * Pong event fired when a pong request has come in from the server.
                         *
                         * @event RTM#pong
                         */
                        self.emit('pong');
                        
                    });
                    
                    // Emit incoming messages
                    self.websocket.on('message', function(data, flags) {
                        
                        var obj = JSON.parse(data);
                        
                        
                        // Emit Slack events as-is
                        if (typeof obj.type !== 'undefined') {
                            
                            /**
                             * Emits messages from the Slack API.
                             *
                             * @event RTM#SlackEvent
                             */
                            self.emit(obj.type, obj);
                            
                        }
                        
                        
                        // Emit a special event for message responses
                        if (typeof obj.reply_to !== 'undefined') {
                            
                            /**
                             * Emits a customized response for responses to sent messages.
                             *
                             * @events RTM#response
                             */
                            self.emit('response-' + obj.reply_to, obj);
                            
                        }
                        
                    });
                    
                    // Handle server-side socket closure
                    self.websocket.on('close', function() {
                        
                        self.connected = false;
                        
                        clearInterval(this.ping.interval);
        
                        /**
                         * Disconnected event fired when the connection to the RTM API is closed.
                         *
                         * @event RTM#disconnected
                         */
                        this.emit('disconnected');
                        
                    });
                    
                    // Handle errors from the socket
                    self.websocket.on('error', function(err) {
                        
                        /**
                         * Socket-Error event fired when an issue with the connection occurs
                         *
                         * @property {Object} err - the error object returned from the websocket
                         *
                         * @see https://api.slack.com/rtm#events
                         *
                         * @event RTM#socket-error
                         */
                        this.emit('socket-error', err);
                        
                    });
                    
                });
                
        } else {
            resolve(false);
        }
        
    });
    
});


/**
 * Disconnects from the Slack service.
 *
 * @returns {boolean} true if the disconnection occurred, false if the connection didn't exist
 * @api public
 */
RTM.prototype.disconnect = function() {
    
    if (this.websocket && this.websocket) {
        
        clearInterval(this.ping.interval);
        
        this.connected = false;
        
        this.websocket.close();
        
        /**
         * Disconnected event fired when the connection to the RTM API is closed.
         *
         * @event RTM#disconnected
         */
        this.emit('disconnected');
        
        return true;
        
    }
    
    // We weren't connected
    return false;
    
};


/**
 * Sends an object to the Slack RTM API.  This method will automatically generate an ID if one is not provided.
 *
 * @param {Object} pkg - the Object to send to the Slack RTM API. `id` does not need to be set.
 *
 * @see https://api.slack.com/rtm#sending_messages
 *
 * @throws {RequestError} if not connected
 * @throws {RequestError} if pkg is not an Object
 * @throws {SlackError} if Slack returns an error
 *
 * @returns {Promise} with the server response when it arrives
 * @api public
 */
RTM.prototype.send = Promise.method(function(pkg) {
    
    var self = this;
    
    return new Promise(function(resolve, reject) {
        
        if (!self.connected) {
            reject(new RequestError('Not connected to the RTM', 0));
            return;
        }
        
        if (typeof pkg !== 'object') {
            reject(new RequestError('Package must be an Object', 0));
            return;
        }
        
        if (typeof pkg.id === 'undefined') {
            pkg.id = UUID.v4();
        }
        
        // Resolve the Promise when we get confirmation from the server
        self.once('response-' + pkg.id, function(response) {
            
            if (typeof response !== 'object' || typeof response.ok === 'undefined') {
                reject(new RequestError('Invalid response', 0));
                return;
            }
            
            if (!response.ok) {
                reject(new SlackError(response));
                return;
            }
            
            resolve(response);
            
        });
        
        // Send our stringified request
        self.websocket.send(JSON.stringify(pkg));
        
    });
    
});


module.exports = RTM;
