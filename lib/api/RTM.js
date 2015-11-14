var util = require('util'),
    EventEmitter = require('events'),
    Promise = require('bluebird'),
    WebSocket = require('ws');


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
 * @returns {boolean} true if a new connection was made, false if already connected
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
                        
                        resolve(true);
                        
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
                        
                        if (typeof obj.type !== 'undefined') {
                            
                            /**
                             * Emits messages from the Slack API.
                             *
                             * @event RTM#SlackEvent
                             */
                            self.emit(obj.type, obj);
                            
                        }
                        
                    });
                    
                    // Handle server-side socket closure
                    self.websocket.on('close', function() {
                        
                        clearInterval(this.ping.interval);
        
                        /**
                         * Disconnected event fired when the connection to the RTM API is closed.
                         *
                         * @event RTM#disconnected
                         */
                        this.emit('disconnected');
                        
                    });
                    
                    /*
                    self.websocket.on('error', self.onRTMError);
                    */
                    
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
 */
RTM.prototype.disconnect = function() {
    
    if (this.connected) {
        
        clearInterval(this.ping.interval);
        
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


module.exports = RTM;
