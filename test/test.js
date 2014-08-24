var assert = require("assert");
var git2provCvt = require("../lib/git2provConverter");
var fs = require('fs');
var exec = require('child_process').exec;



describe('Unit', function(){
  describe('#indexOf()', function(){
    it('should return -1 when the value is not present', function(){
      assert.equal(-1, [1,2,3].indexOf(5));
      assert.equal(-1, [1,2,3].indexOf(9));
    });
  });
});


describe('Integration', function(){


    beforeEach(function(complete) {
         exec("rm -rf testRepo", { timeout : 5000 },function (error, stdout, stderr) {
            complete();
        });
    });

    describe('Test Repo', function(){

        it('should give correct PROV-O serialization on test ProvTrace repo', function(done){

           fs.readFile('test/testProvOdata.n3','utf8', function(err,provOData) {

               git2provCvt.convert("https://github.com/vladistan/ProvTrace","PROV-O","testRepo","http://xxx.bob&d=1" , [], function(a,b,c){
                   assert.equal(a,provOData);
                   assert.equal(b, null);
                   assert.equal(c,"text/plain");
                   done();

               });
           });
        });

        it('should give correct PROV-JSON serialization on test ProvTrace repo', function(done){

                fs.readFile('test/testProvJSONData.json','utf8', function(err,provJSONData) {
                    git2provCvt.convert("https://github.com/vladistan/ProvTrace","PROV-JSON","testRepo","http://xxx.bob&d=1" , [], function(a,b,c){
                        var parsedTestData = JSON.parse(provJSONData);
                        var parsedProvData = JSON.parse(a);
                        assert.deepEqual(parsedProvData, parsedTestData);
                        assert.equal(b, null);
                        assert.equal(c,"text/plain");
                        done();
                    });
                });
        });

        it('should give correct PROV-XML serialization on test ProvTrace repo', function(done){

            fs.readFile('test/testProvXMLData.xml','utf8', function(err,provXMLData) {
                git2provCvt.convert("https://github.com/vladistan/ProvTrace","PROV-XML","testRepo","http://xxx.bob&d=1" , [], function(a,b,c){
                    assert.deepEqual(a, provXMLData);
                    assert.equal(b, null);
                    assert.equal(c,"text/plain");
                    done();
                });
            });
        });

        it('should give correct PROV-N serialization on test ProvTrace repo', function(done){

            fs.readFile('test/testProvNdata.n3','utf8', function(err,provXMLData) {

                git2provCvt.convert("https://github.com/vladistan/ProvTrace","PROV-N","testRepo","http://xxx.bob&d=1" , [], function(a,b,c){
                    assert.deepEqual(a, provXMLData);
                    assert.equal(b, null);
                    assert.equal(c,"text/plain");
                    done();
                });
            });
        });

    });
});

