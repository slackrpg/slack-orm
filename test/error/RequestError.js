/* globals describe, it */

var should = require('should'),
    sinon = require('sinon'),
    
    // Test items
    RequestError = require('../../lib/error/RequestError');


describe('Request Errors', function() {
    
    it('should identify as RequestError', function() {
        var err = new RequestError();
        
        err.name.should.equal('RequestError');
        
        err.should.be.an.instanceOf(RequestError);
        err.should.be.an.instanceOf(Error);
    });
    
    
    it('should properly return response and codes', function() {
        var err = new RequestError('test', 404);
        
        err.message.should.equal('A request error occurred (test)');
        
        err.response.should.equal('test');
        err.code.should.equal(404);
    });
    
});
