var EventEmitter = require('events'),
    Promise = require('bluebird'),
    WebSocket = require('ws'),
    UUID = require('uuid'),
    
    SlackError = require('../error/SlackError'),
    RequestError = require('../error/RequestError');


/**
 * Creates an interface to API calls made over RTM via WebSocket.
 *
 * @module rtm
 *
 * @param {module:rest} api - a connected API service to Slack
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
     * @throws {Error} if a connection is already established
     *
     * @returns {boolean} the response object
     * @api public
     */
    rtm.connect = function() {
        
        const deferred = Promise.defer();
        
        
        if (rtm.connected) {
            deferred.reject(new Error('Connection already established.'));
            return deferred.promise;
        }
        
        
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
                             * @event rtm#ping
                             */
                            rtm.emit('ping');
                        }
                    
                    }, 5000);
                
                    /**
                     * Connected event fired when connected to the RTM API.
                     *
                     * @event rtm#connected
                     */
                    rtm.emit('connected');
                
                    deferred.resolve(response);
                
                });
            
                // Handle server pings
                websocket.on('ping', function(data, flags) {
                
                    websocket.pong();
                    ping.last = Date.now();
                
                    /**
                     * Pinged event fired when a ping request has come in from the server.
                     *
                     * @event rtm#pinged
                     */
                    rtm.emit('pinged');
                
                });
            
                // Handle server pongs
                websocket.on('pong', function() {
                
                    /**
                     * Pong event fired when a pong request has come in from the server.
                     *
                     * @event rtm#pong
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
                         * @event rtm#SlackEvent
                         */
                        rtm.emit(obj.type, obj);
                    
                    }
                
                    // Emit a special event for message responses
                    if (typeof obj.reply_to !== 'undefined') {
                    
                        /**
                         * Emits a customized response for responses to sent messages.
                         *
                         * @events rtm#response
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
                     * @event rtm#disconnected
                     */
                    rtm.emit('disconnected');
                
                });
            
                // Handle errors from the socket
                websocket.on('error', function(err) {
                
                    /**
                     * Socket-Error event fired when an issue with the connection occurs
                     *
                     * @property {object} err - the error object returned from the websocket
                     *
                     * @see https://api.slack.com/rtm#events
                     *
                     * @event rtm#socket-error
                     */
                    rtm.emit('socket-error', err);
                
                });
            
            });
        
        
        return deferred.promise;
        
    };
    
    
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
     * @param {object} pkg - the Object to send to the Slack RTM API. `id` does not need to be set.
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
    rtm.send = function(pkg) {
        
        const deferred = Promise.defer();
        
        if (!rtm.connected) {
            deferred.reject(new RequestError('Not connected to the RTM', 0));
            return deferred.promise;
        }
        
        if (typeof pkg !== 'object') {
            deferred.reject(new RequestError('Package must be an Object', 0));
            return deferred.promise;
        }
        
        // Add a unique ID if none was provided
        if (typeof pkg.id === 'undefined') {
            pkg.id = UUID.v4();
        }
        
        // Resolve the Promise when we get confirmation from the server
        rtm.once('response-' + pkg.id, function(response) {
            
            if (typeof response !== 'object' || typeof response.ok === 'undefined') {
                deferred.reject(new RequestError('Invalid response', 0));
                return deferred.promise;
            }
            
            if (!response.ok) {
                deferred.reject(new SlackError(response));
                return deferred.promise;
            }
            
            deferred.resolve(response);
            
        });
        
        // Send our stringified request
        websocket.send(JSON.stringify(pkg));
        
        
        return deferred.promise;
        
    };
    
    
    return rtm;
    
};
