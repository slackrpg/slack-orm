/*!
 * Slack ORM
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Andrew Vaughan
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */


var util = require('util'),
    EventEmitter = require('events'),
    Promise = require('bluebird'),
    WebSocket = require('ws'),
    
    RestAPI = require('./api/RestAPI');


/**
 * Creates a Slack ORM client.
 *
 * @param {string} token - the API token provided by Slack
 *
 * @see https://api.slack.com/web#authentication
 */
function SlackORM(token) {
    
    /**
     * The API system used by the client.
     * @var {RestAPI} api
     */
    this.api = new RestAPI(token);
    
    
    /**
     * Whether or not the client is actively connected to the RTM API.
     * @var {boolean} connected
     */
    this.connected = false;
    
    
    /**
     * The WebSocket used by this client to maintain a connection with the RTM API.
     * @var {WebSocket} websocket
     */
    this.websocket = null;
    
    
    /**
     * The last time the servers pinged each other.
     * @var {Number} lastPing
     */
    this.lastPing = 0;
    
    
    // Set the client up to emit events
    EventEmitter.call(this);
    
}

util.inherits(SlackORM, EventEmitter);


/**
 * Connects to the Slack service and begins listening for events.
 *
 * @returns {boolean} true if a new connection was made, false if already connected
 */
SlackORM.prototype.connect = Promise.method(function() {
    
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
SlackORM.prototype.disconnect = function() {
    if (this.connected) {
        // @TODO - clear pong timeouts
        
        this.websocket.close();
        this.emit('disconnected');
        
        return true;
        
    }
    
    // We weren't connected
    return false;
};


module.exports = SlackORM;
