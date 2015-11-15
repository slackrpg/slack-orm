var util = require('util');


/**
 * Error that occurs with a HTTP or HTTPS request.
 *
 * @param {string} response - the server response
 * @param {number} code - the code returned from the server
 */
function RequestError(response, code) {
    
    Error.call(this);
    
    
    /**
     * The name of this error.
     * @var {string} name
     */
    this.name = 'RequestError';
    
    
    /**
     * The message supplied with this error.
     * @var {string} message
     */
    this.message = 'A request error occurred (' + response + ')';
    
    
    /**
     * The response from the request agent.
     * @var {string} response
     */
    this.response = response;
    
    
    /**
     * The code from the request agent.
     * @var {number} code
     */
    this.code = code;
    
}

util.inherits(RequestError, Error);


module.exports = RequestError;
