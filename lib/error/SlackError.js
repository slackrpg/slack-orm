var util = require('util');


/**
 * Error that occurs when Slack returns a non-ok response.
 *
 * @param {object} response - the object returned from Slack
 */
function SlackError(response) {
    
    Error.call(this);
    
    
    /**
     * The name of this error.
     * @var {string} name
     */
    this.name = 'SlackError';
    
    
    /**
     * The message supplied with this error.
     * @var {string} message
     */
    this.message = 'An unknown Slack error occurred';
    
    if (response && typeof response.error !== 'undefined') {
        this.message = 'A Slack error occurred (' + response.error + ')';
    }
    
    
    /**
     * The response provided from Slack.
     * @var {object} response
     */
    this.response = response;
    
}

util.inherits(SlackError, Error);


module.exports = SlackError;
