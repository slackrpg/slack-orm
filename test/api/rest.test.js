/* globals describe, it */

var should = require('should'),
    sinon = require('sinon'),
    
    // Test items
    rest = require('../../lib/api/rest'),
    SlackError = require('../../lib/error/SlackError');


describe('The REST API adapter', function() {
    
    var api;
    
    
    before(function() {
        api = rest('');
    });
    
    
    it('should take an API call with no properties', function(done) {
        api.call('api.test')
            .then(function(value) {
                value.should.be.a.Object;
                value.should.have.keys('ok', 'args');
        
                value.ok.should.equal.true;
        
                value.args.should.have.keys('token');
            
                done();
            })
            .catch(function(err) {
                done(err);
            });
    });
    
    
    it('should connect to api.test with multiple properties', function(done) {
        var data = {
            a : 1,
            b : 2,
            c : 'turtle'
        };
        
        api.call('api.test', data)
            .then(function(value) {
                value.should.be.a.Object;
                value.should.have.keys('ok', 'args');
            
                value.ok.should.equal.true;
            
                value.args.should.have.keys('a', 'b', 'c', 'token');
            
                value.args.a.should.equal('1');
                value.args.b.should.equal('2');
                value.args.c.should.equal('turtle');
                
                done();
            })
            .catch(function(err) {
                done(err);
            });
    });
    
    
    it('should connect to api.test with an error', function(done) {
        var data = {
            error : 'my_error'
        };
        
        api.call('api.test', data)
            .then(function(value) {
                done(new Error('Should not have succeeded'));
            })
            .catch(SlackError, function(err) {
                err.should.be.an.instanceOf(SlackError);
                
                err.response.should.have.keys('ok', 'error', 'args');
        
                err.response.ok.should.equal.false;
                err.response.error.should.equal('my_error');
                
                done();
            })
            .catch(function(err) {
                done(err);
            });
    });
    
});
