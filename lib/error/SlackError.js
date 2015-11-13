/**
 * Error that occurs when Slack returns a non-ok response.
 *
 * @param {object} response - the object returned from Slack
 */
function SlackError(response) {
    
    this.message = 'An unknown Slack error occurred';
    
    if (response && typeof response.error !== 'undefined') {
        this.message = 'A Slack error occurred (' + response.error + ')';
    }
    
    this.name = 'SlackError';
    this.stack = (new Error()).stack;
    
    this.response = response;
    
}

SlackError.prototype = Object.create(Error.prototype);
SlackError.prototype.constructor = SlackError;


module.exports = SlackError;
