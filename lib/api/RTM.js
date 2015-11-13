var util = require('util'),
    EventEmitter = require('events'),
    Promise = require('bluebird'),
    WebSocket = require('ws');


/**
 * Creates an interface to API calls made over RTM via WebSocket.
 *
 * @param {RestAPI} api - a connected API service to Slack
 *
 * @see https://api.slack.com/
 */
function RTM(api) {
    this.api = api;
    
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
                    
                    self.websocket.on('open', function() {
                        self.connected = true;
                        self.lastPing = Date.now();
                        
                        // @TODO - Start ping/pongs
                        
                        self.emit('connected');
                        resolve(true);
                    });
                    
                    /*
                    self.websocket.on('message', self.onRTMMessage);
                    self.websocket.on('error', self.onRTMError);
                    self.websocket.on('ping', self.onRTMPing);
                    self.websocket.on('close', self.onRTMClose);
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
        // @TODO - clear pong timeouts
        
        this.websocket.close();
        this.emit('disconnected');
        
        return true;
        
    }
    
    // We weren't connected
    return false;
};


module.exports = RTM;