var EventEmitter = require('events'),
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
 * @fires rtm#connected
 * @fires rtm#disconnected
 * @fires rtm#pinged
 * @fires rtm#ping
 * @fires rtm#pong
 * @fires rtm#socket-error
 * @fires rtm#response
 * @fires rtm#SlackEvent
 *
 * @see https://api.slack.com/rtm
 * @see https://api.slack.com/events
 *
 * @returns {EventEmitter} the RTM module
 */
module.exports = function(api) {
    
    var websocket = null,
        
        ping = {
            last     : 0,
            interval : null
        },
        
        rtm = new EventEmitter();
    
    
    /**
     * Whether we are currently connected to the RTM API.
     * @var {boolean} connected
     * @api public
     */
    rtm.connected = false;
    
    
    /**
     * Connects to the Slack service and begins listening for events.
     *
     * @returns {boolean} the response object if a connection was made, false if already connected
     * @api public
     */
    rtm.connect = Promise.method(function() {
        
        return new Promise(function(resolve, reject) {
            
            if (!rtm.connected) {
                
                api
                    .call('rtm.start')
                    .then(function(response) {
                        
                        websocket = new WebSocket(response.url);
                        
                        // Resolve our state when the connection is established
                        websocket.on('open', function() {
                            
                            rtm.connected = true;
                            ping.last = Date.now();
                            
                            // If we've gone 5+ seconds without interaction, send a ping
                            ping.interval = setInterval(function() {
                                
                                if (ping.last <= Date.now() + 5000) {
                                    websocket.ping();
                                    
                                    /**
                                     * Ping event fired when the client pings the server.
                                     *
                                     * @event RTM#ping
                                     */
                                    rtm.emit('ping');
                                }
                                
                            }, 5000);
                            
                            /**
                             * Connected event fired when connected to the RTM API.
                             *
                             * @event RTM#connected
                             */
                            rtm.emit('connected');
                            
                            resolve(response);
                            
                        });
                        
                        // Handle server pings
                        websocket.on('ping', function(data, flags) {
                            
                            websocket.pong();
                            ping.last = Date.now();
                            
                            /**
                             * Pinged event fired when a ping request has come in from the server.
                             *
                             * @event RTM#pinged
                             */
                            rtm.emit('pinged');
                            
                        });
                        
                        // Handle server pongs
                        websocket.on('pong', function() {
                            
                            /**
                             * Pong event fired when a pong request has come in from the server.
                             *
                             * @event RTM#pong
                             */
                            rtm.emit('pong');
                            
                        });
                        
                        // Emit incoming messages
                        websocket.on('message', function(data, flags) {
                            
                            var obj = JSON.parse(data);
                            
                            
                            // Emit Slack events as-is
                            if (typeof obj.type !== 'undefined') {
                                
                                /**
                                 * Emits messages from the Slack API.
                                 *
                                 * @event RTM#SlackEvent
                                 */
                                rtm.emit(obj.type, obj);
                                
                            }
                            
                            
                            // Emit a special event for message responses
                            if (typeof obj.reply_to !== 'undefined') {
                                
                                /**
                                 * Emits a customized response for responses to sent messages.
                                 *
                                 * @events RTM#response
                                 */
                                rtm.emit('response-' + obj.reply_to, obj);
                                
                            }
                            
                        });
                        
                        // Handle server-side socket closure
                        websocket.on('close', function() {
                            
                            rtm.connected = false;
                            
                            clearInterval(ping.interval);
                            
                            /**
                             * Disconnected event fired when the connection to the RTM API is closed.
                             *
                             * @event RTM#disconnected
                             */
                            rtm.emit('disconnected');
                            
                        });
                        
                        // Handle errors from the socket
                        websocket.on('error', function(err) {
                            
                            /**
                             * Socket-Error event fired when an issue with the connection occurs
                             *
                             * @property {Object} err - the error object returned from the websocket
                             *
                             * @see https://api.slack.com/rtm#events
                             *
                             * @event RTM#socket-error
                             */
                            rtm.emit('socket-error', err);
                            
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
    rtm.disconnect = function() {
        
        if (websocket && websocket) {
            
            clearInterval(ping.interval);
            
            this.connected = false;
            
            websocket.close();
            
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
    rtm.send = Promise.method(function(pkg) {
        
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
            websocket.send(JSON.stringify(pkg));
            
        });
        
    });
    
    
    return rtm;
    
};
