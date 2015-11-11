/**
 * Error that occurs with a HTTP or HTTPS request.
 *
 * @param {string} response - the server response
 * @param {number} code - the code returned from the server
 */
function RequestError(response, code) {
    this.name = 'RequestError';
    this.message = 'A request error occurred (' + response + ')';
    
    this.stack = (new Error()).stack;
    
    this.response = response;
    this.code = code;
}

RequestError.prototype = Object.create(Error.prototype);
RequestError.prototype.constructor = RequestError;


module.exports = RequestError;
