var assert = require("assert");
var sinon  = require('sinon');
var git2provCvt = require("../lib/git2provConverter");
var fs = require('fs');
var exec = require('child_process').exec;
var serializers = require('../lib/provSerializer');



describe('Unit', function(){

    var log_line1 = "Mac-open-c,9ff4ed4636c15aa04c262f9e89c52d451a2c1e6d,21fd9dde98de5b31f4ca89fe0347b44fd2a1997a," +
        "jill,2014-08-14 09:42:05 -0400,vlad,2014-08-14 11:50:51 -0400,Modernized and harmonized the code,D";
    var log_line2 = "Mac-open-c,e01161193fe24e3c8f08a6d80c27ea33dac0c162,x y,bob,2014-08-12 20:06:41 -0400," +
        "john,2014-08-12 20:06:41 -0400,Initial import,A";
    var log_line3 = "README-md,9ff4ed4636c15aa04c262f9e89c52d451a2c1e6d," +
        "21fd9dde98de5b31f4ca89fe0347b44fd2a1997a,vlad,2014-08-14 09:42:05 -0400,vlad,2014-08-14 11:50:51 -0400," +
        "Modernized and harmonized the code,M	README.md";


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
                               "a\tb\tc .",rv);
              });

          });

      });


    });

  });


  describe('ProvObject', function() {



      it('should be constructed and have all necessary sections', function(){
          var p = git2provCvt.getProvObject([],"http:/x");
          assert.equal(p.bundle, "http:/x:provenance");
          assert.deepEqual(p.entities, {});
      });

      describe('Update based on commit obj', function(){

          var cm1 = git2provCvt.getCommitObj(log_line1);
          var cm2 = git2provCvt.getCommitObj(log_line2);
          var cm3 = git2provCvt.getCommitObj(log_line3);

          var pObj = git2provCvt.getProvObject([],"http://y");

          before(function(){
              git2provCvt.updateProvObj(pObj,"http://y",cm1);
              git2provCvt.updateProvObj(pObj,"http://y",cm2);
              git2provCvt.updateProvObj(pObj,"http://y",cm3);
          });

          it('Should contain 2 commits in the activity section', function(){
              assert.deepEqual(Object.keys(pObj.activities).sort(),[
                  "http://y:commit-9ff4ed4636c15aa04c262f9e89c52d451a2c1e6d",
                  "http://y:commit-e01161193fe24e3c8f08a6d80c27ea33dac0c162"
              ]);
          });

          it('Should contain 2 files in the entities section', function(){
              assert.deepEqual(Object.keys(pObj.entities).sort(),[
                  "http://y:file-Mac-open-c_commit-9ff4ed4636c15aa04c262f9e89c52d451a2c1e6d",
                  "http://y:file-Mac-open-c_commit-e01161193fe24e3c8f08a6d80c27ea33dac0c162",
                  "http://y:file-README-md_commit-9ff4ed4636c15aa04c262f9e89c52d451a2c1e6d"
              ]);
          });

          it('Should contain 2 starts in the starts section', function(){
              assert.deepEqual(Object.keys(pObj.starts).sort(),[
                  "http://y:commit-9ff4ed4636c15aa04c262f9e89c52d451a2c1e6d_start",
                  "http://y:commit-e01161193fe24e3c8f08a6d80c27ea33dac0c162_start"
              ]);
          });

          it('Should contain information linkage in the communications section', function(){
              var comm_1 = "http://y:commit-9ff4ed4636c15aa04c262f9e89c52d451a2c1e6d_21fd9dde98de5b31f4ca89fe0347b44fd2a1997a_comm";
              assert.deepEqual(Object.keys(pObj.communications).sort(),[
                  comm_1
              ]);

              assert.equal(pObj.communications[comm_1]["prov:informant"],"http://y:commit-21fd9dde98de5b31f4ca89fe0347b44fd2a1997a");
              assert.equal(pObj.communications[comm_1]["prov:informed"],"http://y:commit-9ff4ed4636c15aa04c262f9e89c52d451a2c1e6d");
          });


          it('Should contain derivation linkage in the communications section', function(){
              var comm_1 = "http://y:file-README-md_commit-9ff4ed4636c15aa04c262f9e89c52d451a2c1e6d_21fd9dde98de5b31f4ca89fe0347b44fd2a1997a_der";
              assert.deepEqual(Object.keys(pObj.derivations).sort(),[
                  comm_1
              ]);

              assert.equal(pObj.derivations[comm_1]["prov:generation"],"http://y:file-README-md_commit-9ff4ed4636c15aa04c262f9e89c52d451a2c1e6d_gen");
              assert.equal(pObj.derivations[comm_1]["prov:usedEntity"],"http://y:file-README-md_commit-21fd9dde98de5b31f4ca89fe0347b44fd2a1997a");
          });



      });

  });

  describe('Commit Obj', function(){


      var obj1 = git2provCvt.getCommitObj(log_line1);
      var obj2 = git2provCvt.getCommitObj(log_line2);

      it("should contain entity id", function() {
          assert.equal(obj1.entity, "file-Mac-open-c");
          assert.equal(obj2.entity, "file-Mac-open-c");
          });

      it("should contain commit-id", function() {
          assert.equal(obj1.id, "commit-9ff4ed4636c15aa04c262f9e89c52d451a2c1e6d");
          assert.equal(obj2.id, "commit-e01161193fe24e3c8f08a6d80c27ea33dac0c162");
          });

      it("should contain parents id", function() {
          assert.deepEqual(obj1.parents, ["21fd9dde98de5b31f4ca89fe0347b44fd2a1997a"]);
          assert.deepEqual(obj2.parents, ["x","y"]);
      });

      it("should contain author", function() {
          assert.equal(obj1.author, "user-jill");
          assert.equal(obj2.author, "user-bob");
      });

      it("should contain author label", function() {
          assert.equal(obj1.author_label, "jill");
          assert.equal(obj2.author_label, "bob");
      });

      it("should contain author date", function() {
          assert.equal(obj1.author_date, "2014-08-14T13:42:05.000Z");
          assert.equal(obj2.author_date, "2014-08-13T00:06:41.000Z");
      });

      it("should contain committer", function() {
          assert.equal(obj1.commiter, "user-vlad");
          assert.equal(obj2.commiter, "user-john");
      });

      it("should contain committer label", function() {
          assert.equal(obj1.commiter_label, "vlad");
          assert.equal(obj2.commiter_label, "john");
      });

      it("should contain committer date", function() {
          assert.equal(obj1.commiter_date, "2014-08-14T15:50:51.000Z");
          assert.equal(obj2.commiter_date, "2014-08-13T00:06:41.000Z");
      });

      it("should contain subject", function() {
          assert.equal(obj1.subject, "Modernized and harmonized the code");
          assert.equal(obj2.subject, "Initial import");
      });

      it("should contain mod type", function() {
          assert.equal(obj1.modification_type, "D");
          assert.equal(obj2.modification_type, "A");
      });




  });

  describe('Get Prefixes', function(){

      it('Shoud generate correct prefix map',function(){

          var prefixes = git2provCvt.getPrefixes("result", "http://xx/", "PROV-O");

          assert.deepEqual(prefixes,{
              "fullResult": "&serialization=PROV-O#",
              "result": "http://xx/#"
          });

          });


  });

  describe('Process file list into log commands ', function(){

      var provObj = git2provCvt.getProvObject(git2provCvt.getPrefixes("result:","http:/zz","PROV-O"));
      var fileList = "README.md\n\n\n\ngit2provConverter.js\nindex.js";
      var log_cmds;

      before(function(){
          log_cmds = git2provCvt.getLogCommands(provObj,fileList,"result:",{});
      });

      it("process file into correct log command list", function(){

          assert.deepEqual(log_cmds,[
              "git --no-pager log --date=iso --name-status --pretty=format:\"README-md,%H,%P,%an,%ad,%cn,%cd,%s,&\" -- README.md",
              "git --no-pager log --date=iso --name-status --pretty=format:\"git2provConverter-js,%H,%P,%an,%ad,%cn,%cd,%s,&\" -- git2provConverter.js",
              "git --no-pager log --date=iso --name-status --pretty=format:\"index-js,%H,%P,%an,%ad,%cn,%cd,%s,&\" -- index.js"
          ]);

      } );

  });

    var rqURL = "http://x/";
    var provObject;



    describe('PROV-XML serialization', function(){

      it("Should return serialization unsupported", function(done){

          var prefixes = git2provCvt.getPrefixes("result:", rqURL, "PROV-XML");
          provObject = git2provCvt.getProvObject(prefixes, rqURL);


          serializers.serializePROVXML(
               git2provCvt.getProvObject(provObject, rqURL),
               '',
               function(result,type){

                   assert.equal(type,"text/plain");
                   assert.equal(result,"serialization unsupported");

                   done();
               }
           );
      });
  });


  describe('Serialization', function(){

      var prefixes = git2provCvt.getPrefixes("result:", rqURL, "PROV-XML");
      provObject = git2provCvt.getProvObject(prefixes, rqURL);


      it("Should return correct minimal PROV-N", function(done){

            var prefixes = git2provCvt.getPrefixes("result:", rqURL, "PROV-N");
            provObject = git2provCvt.getProvObject(prefixes, rqURL);

            serializers.serializePROVN (provObject,'',function(result,type){

                    assert.equal(type,"text/plain");
                    assert.deepEqual(result.split("\n"),[
                        "document",
                        "prefix result: <http://x/#>",
                        "prefix fullResult <&serialization=PROV-N#>",
                        "bundle http://x/:provenance",
                        "endBundle ",
                        "endDocument",
                        ""
                    ]);

                    done();
                }
            );
      });


      it("Should return correct minimal PROV-O", function(done){

          var prefixes = git2provCvt.getPrefixes("result:", rqURL, "PROV-O");
          provObject = git2provCvt.getProvObject(prefixes, rqURL);

          serializers.serializePROVO (provObject,'',function(result,type){

                  assert.equal(type,"text/plain");
                  assert.deepEqual(result.split("\n"),[
                      "@prefix fullResult: <&serialization=PROV-O#> .",
                      "@prefix prov: <http://www.w3.org/ns/prov#> .",
                      "@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .",
                      "@prefix result:: <http://x/#> .",
                      "@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .",
                      "http://x/:provenance\ta\tprov:Bundle ;",
                      "\t\tprov:alternateOf\tfullResult:provenance ."
                  ]);

                  done();
              }
          );
      });


      it("Should return correct minimal PROV-JSON", function(done){

          var rqURL = "http://x/";
          var provObject = git2provCvt.getProvObject(git2provCvt.getPrefixes("result:", rqURL, "PROV-JSON"), rqURL);

           var prefixes = git2provCvt.getPrefixes("result:", rqURL, "PROV-JSON");
           provObject = git2provCvt.getProvObject(prefixes, rqURL);


            serializers.serializePROVJSON(provObject, '', function(result,type){

                  assert.equal(type,"text/plain");
                  assert.equal(result,"{\n  \"prefix\": {\n" +
                      "    \"result:\": \"http://x/#\",\n" +
                      "    \"fullResult\": \"&serialization=PROV-JSON#\"\n  },\n" +
                      "  \"bundle\": {\n    \"http://x/:provenance\": {\n      \"entity\": {},\n" +
                      "      \"agent\": {},\n      \"activity\": {},\n      \"wasStartedBy\": {},\n" +
                      "      \"wasEndedBy\": {},\n      \"wasAttributedTo\": {},\n" +
                      "      \"wasAssociatedWith\": {},\n" +
                      "      \"wasInformedBy\": {},\n" +
                      "      \"specializationOf\": {},\n" +
                      "      \"wasGeneratedBy\": {},\n" +
                      "      \"used\": {},\n" +
                      "      \"wasDerivedFrom\": {},\n" +
                      "      \"wasInvalidatedBy\": {}\n" +
                      "    }\n  }\n}");

                  done();
              }
          );
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

