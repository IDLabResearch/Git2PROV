var assert = require("assert");
var sinon  = require('sinon');
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

    var agentsTestData = {'agents':{
        'e1': {'prov:label': 'E1'},
        'e2': {'prov:label': 'E2'}
    }};

    var communicationTestData = { 'x': {'prov:informant': 'Bob'} };
    var specializationTestData = { 'x': {'prov:agent': 'Alice', 'prov:generalEntity': 'Person'} };
    var attributionTestData = { 'x': {'prov:agent': 'Alice', 'prov:type': 'rumor'} };
    var qualifiedAttributionTestData = { 'x': {'prov:agent': 'Alice', 'prov:type': 'rumor',
                                               'prov:role' : 'editor'} };
    var associationTestData = { 'x': {'prov:agent': 'Alice', 'prov:role': 'editor'} };
    var generationTestData = { 'x': {'prov:activity': 'Editing', 'prov:time': '12:44'} };
    var usageTestData = { 'x': {'prov:entity': 'Pamphlet1', 'prov:time': '12:44'} };
    var derivationTestData = { 'x': { 'prov:usedEntity': 'Table5',  'prov:activity': 'Editing',
                                      'prov:generation': 'Table5_Gen', 'prov:usage': 'Table5_Use' }};
    var invalidationTestData = { 'x': {'prov:activity': 'Editing', 'prov:time': '12:44'} };


    function getN3Stub(triples) {
          var n3API = function () {};
          n3API.prototype.addTriple = function () {};
          n3API.prototype.find = function () {};
          var store = sinon.stub(new n3API());
          store.find.returns(triples);
          return store;
    }

    describe('PROV-N', function() {

        it("should add PROV-N entries correctly", function(){
            var initialRec = "[PREV]\n";
            var rv = serializers.recordWriters.provN.addProvNEntries(
                agentsTestData,
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
            var rv =  serializers.recordWriters.provN.communication(communicationTestData, 'x');
            assert.equal(rv, ", Bob");
        });

        it('Should give correct record for attribution', function () {
            var rv =  serializers.recordWriters.provN.attribution(attributionTestData, 'x');
            assert.equal(rv, ", Alice, [prov:type=\"rumor\"]");
        });

        it('Should give correct record for association', function () {
            var rv =  serializers.recordWriters.provN.association(associationTestData, 'x');
            assert.equal(rv, ", Alice, [prov:role=\"editor\"]");
        });

        it('Should give correct record for specialization', function () {
            var rv =  serializers.recordWriters.provN.specialization(specializationTestData, 'x');
            assert.equal(rv, ", Person");
        });

        it('Should give correct record for generation', function () {
            var rv =  serializers.recordWriters.provN.generation(generationTestData, 'x');
            assert.equal(rv, ", Editing, 12:44");
        });

        it('Should give correct record for usage', function () {
            var rv =  serializers.recordWriters.provN.usage(usageTestData, 'x');
            assert.equal(rv, ", Pamphlet1, 12:44");
        });

        it('Should give correct record for invalidation', function () {
            var rv =  serializers.recordWriters.provN.invalidation(invalidationTestData, 'x');
            assert.equal(rv, ", Editing, 12:44");
        });

        it('Should give correct record for derivation', function () {

            var rv =  serializers.recordWriters.provN.derivation(derivationTestData, 'x');
            assert.equal(rv, ", Table5, Editing, Table5_Gen, Table5_Use");
        });

    });

    describe('ProvO', function(){

      var store;

      beforeEach(function() {
          store = getN3Stub();
      });

      it('Should add prefixes correctly', function() {

          serializers.recordWriters.provO.addPrefix( store,
              {'prefixes':{
                  'e1-extra': "http://x1",
                  'e2-extra': "http://x2"
              }});

          assert.equal(store.addTriple.called,true);
          assert.deepEqual(store.addTriple.getCall(0).args,["@prefix","prov:","<http://www.w3.org/ns/prov#>"]);
          assert.deepEqual(store.addTriple.getCall(1).args,["@prefix","rdfs:","<http://www.w3.org/2000/01/rdf-schema#>"]);
          assert.deepEqual(store.addTriple.getCall(2).args,["@prefix","xsd:","<http://www.w3.org/2001/XMLSchema#>"]);
          assert.deepEqual(store.addTriple.getCall(3).args,["@prefix","e1-extra:","<http://x1>"]);
          assert.deepEqual(store.addTriple.getCall(4).args,["@prefix","e2-extra:","<http://x2>"]);
      });

      it('Should add alt bundles correctly', function() {

            serializers.recordWriters.provO.addAltBundle(
                {'bundle': 'A1', 'alternateBundle': 'A44' }, store);

            assert.equal(store.addTriple.called,true);
            assert.deepEqual(store.addTriple.getCall(0).args,["A1","a","prov:Bundle"]);
            assert.deepEqual(store.addTriple.getCall(1).args,["A1","prov:alternateOf","A44"]);

      });

      it('Should add entities correctly', function() {
          serializers.recordWriters.provO.addEntities( store,
              {'entities':{
                  'e1-extra': {'prov:label': 'E1', 'prov:xactivity': 'e1'},
                  'e2-extra': {'prov:label': 'E2', 'prov:xactivity': 'e2'}
              }}, "bob",'entities','entity', serializers.recordWriters.provO.entity);

          assert.equal(store.addTriple.called,true);
          assert.deepEqual(store.addTriple.getCall(0).args,["e1-extra","a","prov:Entity"]);
          assert.deepEqual(store.addTriple.getCall(1).args,["e1-extra","rdfs:label","\"E1\"@en"]);
          assert.deepEqual(store.addTriple.getCall(2).args,["e2-extra","a","prov:Entity"]);
          assert.deepEqual(store.addTriple.getCall(3).args,["e2-extra","rdfs:label","\"E2\"@en"]);
      });

      it('Should add entities correctly', function() {
            serializers.recordWriters.provO.addEntitiesD( store,
                {'g': { 'e1': {'spec': 'x', 'prov:generalEntity': 'E5' }}},
                "bob",'g','generated', serializers.recordWriters.provO.generalization, 'spec');
            assert.equal(store.addTriple.called,true);
            assert.deepEqual(store.addTriple.getCall(0).args,["generated","prov:specializationOf","E5"]);
      });

      it('Should add agents correctly', function() {

            serializers.recordWriters.provO.addEntities( store, agentsTestData,
                "bob",'agents','agent',serializers.recordWriters.provO.entity);

            assert.equal(store.addTriple.called,true);
            assert.deepEqual(store.addTriple.getCall(0).args,["e1","a","prov:Agent"]);
            assert.deepEqual(store.addTriple.getCall(1).args,["e1","rdfs:label","\"E1\"@en"]);
            assert.deepEqual(store.addTriple.getCall(2).args,["e2","a","prov:Agent"]);
            assert.deepEqual(store.addTriple.getCall(3).args,["e2","rdfs:label","\"E2\"@en"]);
      });

      it('Should add communication correctly', function() {
            serializers.recordWriters.provO.communication( store, communicationTestData,'x','F5');
            assert.equal(store.addTriple.called,true);
            assert.deepEqual(store.addTriple.getCall(0).args,["F5","prov:wasInformedBy","Bob"]);
      });

      it('Should add specialization correctly', function() {
            serializers.recordWriters.provO.generalization( store, specializationTestData,'x','Alice');
            assert.equal(store.addTriple.called,true);
            assert.deepEqual(store.addTriple.getCall(0).args,["Alice","prov:specializationOf","Person"]);
      });

      it('Should add attribution correctly', function() {
            serializers.recordWriters.provO.attribution(store, attributionTestData,'x','wasAttributedTo','F5');
            assert.equal(store.addTriple.called,true);
            assert.deepEqual(store.addTriple.getCall(0).args,["F5","prov:wasAttributedTo","Alice"]);
      });

      it('Should add qualified attribution correctly', function() {
            serializers.recordWriters.provO.attribution(store, qualifiedAttributionTestData,'x','wasAttributedTo','F5');
            assert.equal(store.addTriple.called,true);
            assert.deepEqual(store.addTriple.getCall(0).args,["F5","prov:wasAttributedTo","Alice"]);
            assert.deepEqual(store.addTriple.getCall(1).args,["F5","prov:qualifiedAttribution","[ a prov:Attribution ; prov:agent Alice ; a \"rumor\"@en ]"]);
      });

      it('Should add association correctly', function() {
            serializers.recordWriters.provO.association(store, associationTestData,'x','wasAssociatedWith','F5');
            assert.equal(store.addTriple.called,true);
            assert.deepEqual(store.addTriple.getCall(0).args,["F5","prov:wasAssociatedWith","Alice"]);
            assert.deepEqual(store.addTriple.getCall(1).args,["F5","prov:qualifiedAssociation","[ a prov:Association ; prov:agent Alice ; prov:hadRole \"editor\"@en ]"]);
      });

      it('Should add activity start correctly', function() {
            var testData = { 'x': {'prov:time': '10:44'} };
            serializers.recordWriters.provO.activityStart(store, testData,'x','F5');
            assert.equal(store.addTriple.called,true);
            assert.deepEqual(store.addTriple.getCall(0).args,["F5","prov:startedAtTime","\"10:44\"^^xsd:dateTime"]);
      });

      it('Should add activity end correctly', function() {
            var testData = { 'x': {'prov:time': '10:44'} };
            serializers.recordWriters.provO.activityEnd(store, testData,'x','F5');
            assert.equal(store.addTriple.called,true);
            assert.deepEqual(store.addTriple.getCall(0).args,["F5","prov:endedAtTime","\"10:44\"^^xsd:dateTime"]);
      });

      it('Should add generation correctly', function() {
            serializers.recordWriters.provO.generation(store, generationTestData,'x','wasGeneratedBy', 'F5');
            assert.equal(store.addTriple.called,true);
            assert.deepEqual(store.addTriple.getCall(0).args,["F5","prov:wasGeneratedBy","Editing"]);
            assert.deepEqual(store.addTriple.getCall(1).args,["F5",
                "prov:qualifiedGeneration",
                "[ a prov:Generation ; prov:activity Editing ; prov:atTime \"12:44\"^^xsd:dateTime ]"]);
      });

      it('Should add usage correctly', function() {
            serializers.recordWriters.provO.usage(store, usageTestData,'x','usedBy', 'F5');
            assert.equal(store.addTriple.called,true);
            assert.deepEqual(store.addTriple.getCall(0).args,["F5","prov:usedBy","Pamphlet1"]);
            assert.deepEqual(store.addTriple.getCall(1).args,["F5",
                "prov:qualifiedUsage",
                "[ a prov:Usage ; prov:entity Pamphlet1 ; prov:atTime \"12:44\"^^xsd:dateTime ]"]);
      });

      it('Should add derivation correctly', function() {
            serializers.recordWriters.provO.derivation(store, derivationTestData,'x','derived', 'F5');
            assert.equal(store.addTriple.called,true);
            assert.deepEqual(store.addTriple.getCall(0).args,["F5","prov:derived","Table5"]);
            assert.deepEqual(store.addTriple.getCall(1).args,["F5",
                "prov:qualifiedDerivation",
                "[ a prov:Derivation ; prov:entity Table5 ; prov:hadGeneration Table5_Gen ; prov:hadUsage Table5_Use ; prov:hadActivity Editing ]"]);
      });

      it('Should add invalidation correctly', function() {
            serializers.recordWriters.provO.invalidation(store, invalidationTestData,'x','invalidated', 'F5');
            assert.equal(store.addTriple.called,true);
            assert.deepEqual(store.addTriple.getCall(0).args,["F5","prov:invalidated","Editing"]);
            assert.deepEqual(store.addTriple.getCall(1).args,["F5",
                "prov:qualifiedInvalidation",
                "[ a prov:Invalidation ; prov:activity Editing ; prov:atTime \"12:44\"^^xsd:dateTime ]"]);
      });


      describe("Nice Turtle writer", function(){

          describe('CMP', function(){

              it('should return 0 when properties are the same', function(){
                  var rv = serializers.recordWriters.provO.cmp('a','a');
                  assert.equal(0,rv);});

              it('should return -1 when first property is smaller', function(){
                  var rv = serializers.recordWriters.provO.cmp('a','b');
                  assert.equal(-1,rv);});

              it('should return 1 when first property is larger', function(){
                  var rv = serializers.recordWriters.provO.cmp('f','b');
                  assert.equal(1,rv);});

          });

          describe('Statement from Triple', function(){

              var triple = { 'subject': 'bob', 'predicate': 'eats', 'object': 'pie'};
              var statementFromTriple = serializers.recordWriters.provO.statementFromTriple;

              it('should output whole statement when no specialial cases apply', function() {
                  var rv = statementFromTriple(triple,0,false,false);
                  assert.equal(rv, "bob\teats\tpie ");
              });

              it('should prepend statement with .\\n if it is not a first triple ', function() {

                  var rv = statementFromTriple(triple,5,false,false);
                  assert.equal(rv, ".\nbob\teats\tpie ");
              });

              it('should skip subject if it is the same as previous ', function() {

                  var rv = statementFromTriple(triple,5,true,false);
                  assert.equal(rv, ";\n\t\teats\tpie ");
              });

              it('should skip predicate if it is the same as previous ', function() {
                  var rv = statementFromTriple(triple,5,true,true);
                  assert.equal(rv, ",\n\t\t\t\tpie ");
              });

          });


          describe('Get turtle from N3', function(){

              var store = getN3Stub([
                  {subject:'@prefix',predicate:'b',object:'c'},
                  {subject:'a',predicate:'b',object:'c'}
              ]);

              it('should get correct representation of triples', function(){
                  var rv = serializers.recordWriters.provO.getTurtle(store);
                  assert.equal("@prefix b c .\n" +
                               "a\tb\t\c .",rv);
              });

          });

      });


    });

  });





});


describe('Integration', function(){


    beforeEach(function(complete) {
         exec("rm -rf testRepo", { timeout : 5000 },
             function() { complete(); });
    });

    describe('Test Repo', function(){

        it('should give correct PROV-O serialization on test ProvTrace repo', function(done){

           fs.readFile('test/testProvOdata.n3','utf8', function(err,provOData) {

               git2provCvt.convert("https://github.com/vladistan/ProvTrace","PROV-O","testRepo","http://xxx.bob&d=1" , [], function(a,b,c){
                   assert.deepEqual(a.split('\n'), provOData.split('\n'));
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

