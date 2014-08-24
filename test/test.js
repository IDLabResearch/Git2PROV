var assert = require("assert");
var git2provCvt = require("../lib/git2provConverter");
var fs = require('fs');
var exec = require('child_process').exec;
var serializers = require('../lib/provSerializer');



describe('Unit', function(){
  describe('#indexOf()', function(){
    it('should return -1 when the value is not present', function(){
      assert.equal(-1, [1,2,3].indexOf(5));
      assert.equal(-1, [1,2,3].indexOf(9));
    });
  });

  describe('ProvSerializer ShouldBeAdded', function() {
      var testColl = { 'a': 1,  'd': 23, 'bill': 9 };
      var ignoreBlock = "bob;bill,dope";
      it('Should allow to add property for which we have entry', function() {
          var a = 'a';
          var rv = serializers.shouldBeAdded(testColl, ignoreBlock, a, 'a-block');
          assert.equal(rv, true);
      } );

      it('Should not-allow to add property which we have in ignore block', function() {
          var a = 'bill';
          var rv = serializers.shouldBeAdded(testColl, ignoreBlock, a, 'bill');
          assert.equal(rv, false);
      } );

      it('Should not-allow to add property which is not in a collection', function() {
          var a = 'bruce';
          var rv = serializers.shouldBeAdded(testColl, ignoreBlock, a, 'bruce');
          assert.equal(rv, false);
      } );
  });

  describe('Add to JSON bundle', function() {

      var jSONObj;
      var ignoreBlock = "bob;dope";
      var provObj = { 'bills': [1,2,3], 'bundle': 'bill' };

      beforeEach(function(complete) {
          jSONObj =  {'bundle': { 'bill': {}}};
          complete();
      });

      it('Should add bundle to JSON object', function() {

          serializers.addToJSONBundleIfNeeded(jSONObj,provObj,ignoreBlock,'bills','bill');
          assert.deepEqual({bill: [1,2,3]}, jSONObj.bundle.bill);

      } );

      it('Should add bundle to JSON object if set is ignored', function() {

          serializers.addToJSONBundleIfNeeded(jSONObj,provObj,"bill",'bills','bill');
          assert.deepEqual({}, jSONObj.bundle.bill);

      } );

      it('Should not add bundle to JSON object if receptacle is not there', function() {
          serializers.addToJSONBundleIfNeeded(jSONObj,provObj,ignoreBlock,'drews','drew');
          assert.deepEqual({}, jSONObj.bundle.bill);

      } );
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

