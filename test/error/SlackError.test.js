/* globals describe, it */

var should = require('should'),
    sinon = require('sinon'),
    
    // Test items
    SlackError = require('../../lib/error/SlackError');


describe('Slack Errors', function() {
    
    it('should identify as SlackError', function() {
        var err = new SlackError();
        
        err.name.should.equal('SlackError');
        
        err.should.be.an.instanceOf(SlackError);
        err.should.be.an.instanceOf(Error);
    });
    
    
    it('should show an unknown error if one was not provided', function() {
        var err = new SlackError();
        
        err.message.should.equal('An unknown Slack error occurred');
        (typeof err.response === 'undefined').should.be.true;
    });
    
    
    it('should contain the error and response if one is provided', function() {
        var err = new SlackError({
            error : 'test'
        });
        
        err.message.should.equal('A Slack error occurred (test)');
        
        err.response.should.be.an.Object;
        err.response.error.should.equal('test');
    });
    
});
