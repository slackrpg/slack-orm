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


var rest = require('./api/rest'),
    realtime = require('./api/rtm');


/**
 * Creates a Slack ORM client.
 *
 * @module slackorm
 *
 * @param {string} token - the API token provided by Slack
 *
 * @see https://api.slack.com/web#authentication
 *
 * @returns {object} the SlackORM module
 */
module.exports = function(token) {
    
    var api = rest(token),
        rtm = realtime(api);
    
    
    return {
        
        /**
         * The API system used by the client.
         * @var {RestAPI} api
         */
        api,
        
        
        /**
         * The connection to the RTM service.
         * @var {RTM} rtm
         */
        rtm
        
    };
    
};
