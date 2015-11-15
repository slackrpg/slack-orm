var Promise = require('bluebird'),
    https = require('https'),
    querystring = require('querystring'),
    
    SlackError = require('../error/SlackError'),
    RequestError = require('../error/RequestError');


/**
 * Creates an interface to API calls made over REST services provided by Slack.
 *
 * @module rest
 *
 * @param {string} token - the API token provided by Slack
 *
 * @see https://api.slack.com/
 *
 * @returns {object} the Rest module
 */
module.exports = function(token) {
    
    return {
        
        /**
         * Makes a RESTful API call to the Slack API.
         *
         * @param {string} method - the API method to send
         * @param {object} params - an object of parameters to send with the call (optional)
         *
         * @throws {RequestError} if an error occurred during the request
         * @throws {SlackError} if an error was returned from the API
         *
         * @returns {Promise} a Promise that can handle positive or rejection callbacks
         * @api public
         */
        call : Promise.method(function(method, params) {
            
            if (typeof params === 'undefined') {
                params = {};
            }
            
            return new Promise(function(resolve, reject) {
                
                var request, options, body;
                
                // Add our Slack token to the parameters to be sent
                params.token = token;
                
                // Serialize our options
                body = querystring.stringify(params);
                
                options = {
                    hostname : 'api.slack.com',
                    method   : 'POST',
                    path     : '/api/' + method,
                    headers  : {
                        'Content-Type'   : 'application/x-www-form-urlencoded',
                        'Content-Length' : body.length
                    }
                };
                
                // Process our request
                request = https.request(options);
                
                // If we get a response, record it
                request.on('response', function(response) {
                    
                    var buffer = '';
                    
                    response.on('data', function(chunk) {
                        buffer += chunk;
                    });
                    
                    response.on('end', function() {
                        
                        var value;
                        
                        // We got a full response back, let's parse it
                        if (response.statusCode === 200) {
                            value = JSON.parse(buffer);
                            
                            // Slack always returns "ok" as true if things went well
                            if (value.ok === true) {
                                resolve(value);
                                
                            // Otherwise we had a Slack error returned
                            } else {
                                reject(new SlackError(value));
                            }
                            
                        // We got a non-200 response
                        } else {
                            reject(new RequestError(buffer, response.statusCode));
                        }
                        
                    });
                    
                });
                
                
                // Handle errors from the request
                request.on('error', function(error) {
                    reject(new RequestError(error.message, error.errno));
                });
                
                
                // Make our request
                request.write(String(body));
                request.end();
                
            });
            
        })
        
    };
    
};
