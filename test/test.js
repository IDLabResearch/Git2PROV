var assert = require("assert");
var git2provCvt = require("../lib/git2provConverter");
var fs = require('fs');
var exec = require('child_process').exec;
var serializers = require('../lib/provSerializer');



describe('Unit', function(){

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

  describe('Record writers', function() {

    describe('PROV-N', function() {

        it("should add PROV-N entries correctly", function(){
            var initialRec = "[PREV]\n";
            var rv = serializers.recordWriters.provN.addProvNEntries(
                {'agents':{
                    'e1': {'prov:label': 'E1'},
                    'e2': {'prov:label': 'E2'}
                }},
               "bob", initialRec,'agents','X', function(x,y) {
               return " : " + x[y]['prov:label'] ;
           });
           assert.equal(rv, initialRec  + "X(e1 : E1)\nX(e2 : E2)\n" );
        });


        it("should add PROV-N entries correctly, using alternate subject", function(){
            var initialRec = "[PREV]\n";
            var rv = serializers.recordWriters.provN.addProvNEntries(
                {'agents':{
                    'e1-extra': {'prov:label': 'E1', 'prov:xactivity': 'e1'},
                    'e2-extra': {'prov:label': 'E2', 'prov:xactivity': 'e2'}
                }},
                "bob", initialRec,'agents','X', function(x,y) {
                    return " : " + x[y]['prov:label'] ;
                }, "prov:xactivity" );
            assert.equal(rv, initialRec  + "X(e1 : E1)\nX(e2 : E2)\n" );
        });

        it("should add PROV-N prefixes correctly", function(){
            var initialRec = "[PREV]\n";
            var rv = serializers.recordWriters.provN.addPrefixes(
                {'prefixes':{
                    'p1': 'prefix1',
                    'p2': 'prefix2'
                }},
                "{S}\n" );
            assert.equal(rv, "{S}\nprefix p1 <prefix1>\nprefix p2 <prefix2>\n" );
        });



        it('Should give correct record for entity', function () {
            var rv =  serializers.recordWriters.provN.entity({ 'x': {'prov:label': 'X'} }, 'x');
            assert.equal(rv, ", [prov:label=\"X\"]");
        });

        it('Should give correct record for was started by', function () {
            var rv =  serializers.recordWriters.provN.wasStartedBy({ 'x': {'prov:time': '11111'} }, 'x');
            assert.equal(rv, ", -, -, 11111");
        });

        it('Should give correct record for communication', function () {
            var rv =  serializers.recordWriters.provN.communication({ 'x': {'prov:informant': 'Bob'} }, 'x');
            assert.equal(rv, ", Bob");
        });

        it('Should give correct record for attribution', function () {
            var rv =  serializers.recordWriters.provN.attribution({ 'x': {'prov:agent': 'Alice', 'prov:type': 'rumor'} }, 'x');
            assert.equal(rv, ", Alice, [prov:type=\"rumor\"]");
        });

        it('Should give correct record for association', function () {
            var rv =  serializers.recordWriters.provN.association({ 'x': {'prov:agent': 'Alice', 'prov:role': 'editor'} }, 'x');
            assert.equal(rv, ", Alice, [prov:role=\"editor\"]");
        });

        it('Should give correct record for specialization', function () {
            var rv =  serializers.recordWriters.provN.specialization({ 'x': {'prov:agent': 'Alice', 'prov:generalEntity': 'Person'} }, 'x');
            assert.equal(rv, ", Person");
        });

        it('Should give correct record for generation', function () {
            var rv =  serializers.recordWriters.provN.generation({ 'x': {'prov:activity': 'Editing', 'prov:time': '12:44'} }, 'x');
            assert.equal(rv, ", Editing, 12:44");
        });

        it('Should give correct record for usage', function () {
            var rv =  serializers.recordWriters.provN.usage({ 'x': {'prov:entity': 'Pamphlet1', 'prov:time': '12:44'} }, 'x');
            assert.equal(rv, ", Pamphlet1, 12:44");
        });

        it('Should give correct record for invalidation', function () {
            var rv =  serializers.recordWriters.provN.invalidation({ 'x': {'prov:activity': 'Editing', 'prov:time': '12:44'} }, 'x');
            assert.equal(rv, ", Editing, 12:44");
        });

        it('Should give correct record for derivation', function () {
            var rv =  serializers.recordWriters.provN.derivation({ 'x': {
                'prov:usedEntity': 'Table5',
                'prov:activity': 'Editing',
                'prov:generation': 'Table5_Gen',
                'prov:usage': 'Table5_Use'
            }}, 'x');
            assert.equal(rv, ", Table5, Editing, Table5_Gen, Table5_Use");
        });

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

