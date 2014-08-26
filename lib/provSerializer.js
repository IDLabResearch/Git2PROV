/* A module that has functions to serialize arrays of data into PROV-N, PROV-O or PROV-XML */
var n3 = require('n3');

/* Serialize the specified entries in the specified serialization (default: PROV-N) */
function serialize(serialization, provObject, ignore, callback){
  switch(serialization) {
    case "PROV-JSON":
      serializePROVJSON(provObject, ignore, callback);
      break;
    case "PROV-O":
      serializePROVO(provObject, ignore, callback);
      break;
    case "PROV-XML":
      serializePROVXML(provObject, ignore, callback);
      break;
    default:
      serializePROVN(provObject, ignore, callback);
  }
}

function shouldBeAdded(provSet, ignoreBLock, arg, ignoreAttr) {
    return provSet.hasOwnProperty(arg) && ignoreBLock.indexOf(ignoreAttr) < 0;
}

function addToJSONBundleIfNeeded(provJSONObject, provObject, ignoreBlock, attrPlural, attrSingular) {

    var provSet = provObject[attrPlural];
    var bundlename = provObject.bundle;

    if (provSet && ignoreBlock.indexOf(attrSingular) < 0) {
        provJSONObject.bundle[bundlename][attrSingular] = provSet;
    }
}


/* Serialize the specified entries as a PROV-JSON object */
function serializePROVJSON(provObject, ignore, callback){

  var provJSONObject = {};
  provJSONObject.prefix = provObject.prefixes;
  provJSONObject.bundle = {};
  provJSONObject.bundle[provObject.bundle] = {};

  addToJSONBundleIfNeeded(provJSONObject, provObject, ignore, 'entities', 'entity');
  addToJSONBundleIfNeeded(provJSONObject, provObject, ignore, 'agents', 'agent');
  addToJSONBundleIfNeeded(provJSONObject, provObject, ignore, 'activities', 'activity');
  addToJSONBundleIfNeeded(provJSONObject, provObject, ignore, 'starts', 'wasStartedBy');
  addToJSONBundleIfNeeded(provJSONObject, provObject, ignore, 'ends', 'wasEndedBy');
  addToJSONBundleIfNeeded(provJSONObject, provObject, ignore, 'attributions', 'wasAttributedTo');
  addToJSONBundleIfNeeded(provJSONObject, provObject, ignore, 'associations', 'wasAssociatedWith');
  addToJSONBundleIfNeeded(provJSONObject, provObject, ignore, 'communications', 'wasInformedBy');
  addToJSONBundleIfNeeded(provJSONObject, provObject, ignore, 'specializations', 'specializationOf');
  addToJSONBundleIfNeeded(provJSONObject, provObject, ignore, 'generations', 'wasGeneratedBy');
  addToJSONBundleIfNeeded(provJSONObject, provObject, ignore, 'usages', 'used');
  addToJSONBundleIfNeeded(provJSONObject, provObject, ignore, 'derivations', 'wasDerivedFrom');
  addToJSONBundleIfNeeded(provJSONObject, provObject, ignore, 'invalidations', 'wasInvalidatedBy');

  callback(JSON.stringify(provJSONObject, undefined, 2),"text/plain");//TODO: change to text/json
}



function addProvNEntries(provObject, ignore, prov, section, singular, getRecord, altSubj) {


    var entry_collection = provObject[section];

    for (var entity in  entry_collection) {
        if (shouldBeAdded(entry_collection, ignore, entity, singular)) {
            var subj = (altSubj ? entry_collection[entity][altSubj] : entity  );
            prov += singular + "(" + subj + getRecord(entry_collection, entity) + ")" + "\n";
        }
    }
    return prov;
}


function addPrefixes(provObject, prov) {
    for (var prefix in provObject.prefixes) {
        if (provObject.prefixes.hasOwnProperty(prefix)) {
            prov += "prefix " + prefix + " <" + provObject.prefixes[prefix] + ">" + "\n";
        }
    }
    return prov;
}

function getEntityRecord(entities, entity) {
    return (entities[entity]["prov:label"] ? ", [prov:label=\"" + entities[entity]["prov:label"] + "\"]" : "");
}

function getWasStartedByRecord(starts, start) {
    return  ", -, -, " + starts[start]["prov:time"];
}

function getAttributionRecord(attributions, attribution) {
    return ", " + attributions[attribution]["prov:agent"] + ", [prov:type=\"" + attributions[attribution]["prov:type"] + "\"]";
}

function getAssociationsRecord(associations, association) {
    return ", " + associations[association]["prov:agent"] + ", [prov:role=\"" + associations[association]["prov:role"] + "\"]";
}

function getCommunicationRecord(communications, communication) {
    return ", " + communications[communication]["prov:informant"];
}

function getSpecializationRecord(specializations, specialization) {
    return ", " + specializations[specialization]["prov:generalEntity"];
}

function getGenerationRecord(generations, generation) {
    return ", " + generations[generation]["prov:activity"] + ", " + generations[generation]["prov:time"];
}

function getUsageRecord(usages, usage) {
    return ", " + usages[usage]["prov:entity"] + ", " + usages[usage]["prov:time"];
}


function getDerivationRecord(derivations, derivation) {
    return ", " + derivations[derivation]["prov:usedEntity"] + ", " + derivations[derivation]["prov:activity"] +
        ", " + derivations[derivation]["prov:generation"] + ", " + derivations[derivation]["prov:usage"];
}

function getInvalidationRecord(invalidations, invalidation) {
    return ", " + invalidations[invalidation]["prov:activity"] + ", " + invalidations[invalidation]["prov:time"];
}

/* Serialize the specified PROV-JSON object in PROV-N */
function serializePROVN(provObject, ignore, callback){
  //write everything to the result string
  var prov = "document" + "\n";

  prov = addPrefixes(provObject, prov);
  prov += "bundle " + provObject.bundle + "\n";

  prov = addProvNEntries(provObject, ignore, prov, 'entities', 'entity', getEntityRecord);
  prov = addProvNEntries(provObject, ignore, prov, 'agents', 'agent', getEntityRecord);
  prov = addProvNEntries(provObject, ignore, prov, 'activities', 'activity', getEntityRecord);
  prov = addProvNEntries(provObject, ignore, prov, 'starts', 'wasStartedBy', getWasStartedByRecord, "prov:activity");
  prov = addProvNEntries(provObject, ignore, prov, 'ends', 'wasEndedBy', getWasStartedByRecord, "prov:activity" );
  prov = addProvNEntries(provObject, ignore, prov, 'attributions', 'wasAttributedTo', getAttributionRecord, "prov:entity" );
  prov = addProvNEntries(provObject, ignore, prov, 'associations', 'wasAssociatedWith', getAssociationsRecord, "prov:activity" );
  prov = addProvNEntries(provObject, ignore, prov, 'communications', 'wasInformedBy', getCommunicationRecord, "prov:informed" );
  prov = addProvNEntries(provObject, ignore, prov, 'specializations', 'specializationOf', getSpecializationRecord, "prov:specificEntity" );
  prov = addProvNEntries(provObject, ignore, prov, 'generations', 'wasGeneratedBy', getGenerationRecord, "prov:entity" );
  prov = addProvNEntries(provObject, ignore, prov, 'usages', 'used', getUsageRecord, "prov:activity" );
  prov = addProvNEntries(provObject, ignore, prov, 'derivations', 'wasDerivedFrom', getDerivationRecord, "prov:generatedEntity" );
  prov = addProvNEntries(provObject, ignore, prov, 'invalidations', 'wasInvalidatedBy', getInvalidationRecord, "prov:entity" );


  prov += "endBundle " + "\n";
  prov += "endDocument" + "\n";
  callback(prov,"text/plain");//TODO: change to text/prov-notation
}

function cmp(a, b) {
    return (a.toLowerCase() > b.toLowerCase())  ? 1  :
           ((a.toLowerCase() < b.toLowerCase()) ? -1 : 0);
}


/* Serialize the specified PROV-JSON object in PROV-O */
function statementFromTriple(triple, count, sameSubj, samePred) {

    var statement = "";

    if (count > 0) {
        statement += (sameSubj ? (samePred ? "," : ";") : ".") + "\n";
    }

    if (sameSubj) {
        statement += "\t" + "\t";
    } else {
        statement += triple.subject + "\t";
    }

    if (sameSubj && samePred) {
        statement += "\t";
    } else {
        statement += triple.predicate;
    }

    statement += "\t" + triple.object + " ";

    return statement;
}


function getTurtle(store) {
    var provo = "";


    var triples = store.find();
    triples = triples.sort(function (a, b) {
        return cmp(a.subject, b.subject) || cmp(a.predicate, b.predicate) || cmp(a.object, b.object);
    });


    var previousTriple = {};
    var count = 0;
    triples.forEach(function (triple) {
        if (triple.subject === "@prefix") {
            // For prefixes, always rewrite the subject
            provo += triple.subject + " " + triple.predicate + " " + triple.object + " .\n";
        } else {
            // For all other triples, don't re-write the subject/predicate when it's the same as the previous
            var prevSubj = previousTriple.subject === triple.subject;
            var prevPred = previousTriple.predicate === triple.predicate;
            provo += statementFromTriple(triple, count, prevSubj, prevPred);
            count++;
        }
        previousTriple = triple;
    });
    provo += ".";
    return provo;
}


function capitalize(string){
   return string.charAt(0).toUpperCase() + string.slice(1);
}



function addEntityRecord(store, entityCollection, entity, subject) {
    store.addTriple(subject, "rdfs:label", "\"" + entityCollection[entity]["prov:label"] + "\"@en");
}

function addActivityStartedAtRecord(store, entityCollection, entity, subject) {
    store.addTriple(subject, "prov:startedAtTime", "\"" + entityCollection[entity]["prov:time"] + "\"^^xsd:dateTime");
}

function addActivityEndedAtRecord(store, entityCollection, entity, subject) {
    store.addTriple(subject, "prov:endedAtTime", "\"" + entityCollection[entity]["prov:time"] + "\"^^xsd:dateTime");
}

function addCommunicationRecord(store, entityCollection, entity, subject) {
    store.addTriple(subject, "prov:wasInformedBy", entityCollection[entity]["prov:informant"]);
}

function addGeneralizationRecord(store, entityCollection, entity, subject) {
    store.addTriple(subject, "prov:specializationOf", entityCollection[entity]["prov:generalEntity"]);
}


function addGenerationsRecords(store, entityCollection, entity, singular, subj) {

    var record = entityCollection[entity];
    store.addTriple(subj, "prov:"+ singular, record["prov:activity"]);
    if (record["prov:time"]) {
        store.addTriple(subj, "prov:qualifiedGeneration",
                "[ a prov:Generation ; prov:activity " + record["prov:activity"] + " ; " +
                "prov:atTime \"" + record["prov:time"] + "\"^^xsd:dateTime ]");
    }
    //TODO: format this better
}

function addUsageRecords(store, entityCollection, entity, singular, subj) {

    var record = entityCollection[entity];
    store.addTriple(subj, "prov:" + singular, record["prov:entity"]);
    if (record["prov:time"]) {
        store.addTriple(subj, "prov:qualifiedUsage",
                "[ a prov:Usage ; prov:entity " + record["prov:entity"] + " ; " +
                    "prov:atTime \"" + record["prov:time"] + "\"^^xsd:dateTime ]");
    }
    //TODO: format this better
}


function addDerivationRecords(store, entityCollection,  entity, singular, subj) {

    var record = entityCollection[entity];
    store.addTriple(subj, "prov:"+ singular, record["prov:usedEntity"]);
    if (record["prov:generation"] && record["prov:usage"] &&
        record["prov:activity"]) {
        store.addTriple(subj, "prov:qualifiedDerivation",
                "[ a prov:Derivation ; prov:entity " + record["prov:usedEntity"] + " ; " +
                    "prov:hadGeneration " + record["prov:generation"] + " ; " +
                    "prov:hadUsage " + record["prov:usage"] + " ; " +
                    "prov:hadActivity " + record["prov:activity"] + " ]");
    }
    //TODO: format this better
}

function addInvalidationRecords(store, entityCollection, entity, singular, subj) {

    store.addTriple(subj, "prov:"+ singular, entityCollection[entity]["prov:activity"]);
    if (entityCollection[entity]["prov:time"]) {
        store.addTriple(subj, "prov:qualifiedInvalidation",
                "[ a prov:Invalidation ; prov:activity " + entityCollection[entity]["prov:activity"] + " ; " +
                    "prov:atTime \"" + entityCollection[entity]["prov:time"] + "\"^^xsd:dateTime ]");
    }
}



function addAttributionRecords(store, entityCollection, entity, singular, subj) {
    store.addTriple(subj, "prov:" + singular, entityCollection[entity]["prov:agent"]);
    if (entityCollection[entity]["prov:type"]) {
        store.addTriple(subj, "prov:qualifiedAttribution",
                "[ a prov:Attribution ; prov:agent " + entityCollection[entity]["prov:agent"] + " ; " +
                  "a \"" + entityCollection[entity]["prov:type"] + "\"@en ]");
    }
}

function addAssociationRecords(store, entityCollection, entity, singular, subj) {
    var record = entityCollection[entity];
    store.addTriple(subj, "prov:" + singular, record["prov:agent"]);
    if (record["prov:role"]) {
        store.addTriple(subj, "prov:qualifiedAssociation",
                "[ a prov:Association ; prov:agent " + record["prov:agent"] + " ; " +
                    "prov:hadRole \"" + record["prov:role"] + "\"@en ]");
    }
}


function addProvEntityTriples(store, provObject, ignore, section, singular, recordWriter, altSubj) {
    var entityCollection = provObject[section];
    for (var entity in  entityCollection) {
        if (shouldBeAdded(entityCollection, ignore, entity, singular)) {
            altSubj || store.addTriple(entity, "a", "prov:" + capitalize(singular));
            if (entityCollection[entity]["prov:label"] || altSubj ) {
                var subj = (altSubj ? entityCollection[entity][altSubj] : entity  );
                recordWriter(store, entityCollection, entity, subj);
            }
        }
    }
}

function addProvEntityTriplesDbl(store, provObject, ignore, section, singular, recordWriter, altSubj) {
    var entityCollection = provObject[section];
    for (var entity in  entityCollection) {
        if (shouldBeAdded(entityCollection, ignore, entity, singular)) {
            var subj = entityCollection[entity][altSubj];
            recordWriter(store, entityCollection, entity, singular, subj);
            //TODO: format this better
        }
    }
}


function addPrefixTriples(store, provObject) {
    store.addTriple("@prefix", "prov:", "<http://www.w3.org/ns/prov#>");
    store.addTriple("@prefix", "rdfs:", "<http://www.w3.org/2000/01/rdf-schema#>");
    store.addTriple("@prefix", "xsd:", "<http://www.w3.org/2001/XMLSchema#>");

    for (var prefix in provObject.prefixes) {
        if (provObject.prefixes.hasOwnProperty(prefix)) {
            store.addTriple("@prefix", prefix + ":", "<" + provObject.prefixes[prefix] + ">");
        }
    }
}


function addAltBundleTriples(provObject, store) {
    if (provObject.bundle) {
        store.addTriple(provObject.bundle, "a", "prov:Bundle");
        if (provObject.alternateBundle) {
            store.addTriple(provObject.bundle, "prov:alternateOf", provObject.alternateBundle);
        }
    }
}



function storeProvInN3(store, provObject, ignore) {

    addPrefixTriples(store, provObject);
    addAltBundleTriples(provObject, store);


    addProvEntityTriples(store, provObject, ignore, 'entities', 'entity', addEntityRecord);
    addProvEntityTriples(store, provObject, ignore, 'agents', 'agent', addEntityRecord);
    addProvEntityTriples(store, provObject, ignore, 'activities', 'activity', addEntityRecord);
    addProvEntityTriples(store, provObject, ignore, 'starts', 'wasStartedBy', addActivityStartedAtRecord,  "prov:activity");
    addProvEntityTriples(store, provObject, ignore, 'ends', 'wasEndedBy', addActivityEndedAtRecord,  "prov:activity");

    addProvEntityTriplesDbl(store, provObject, ignore, 'attributions', 'wasAttributedTo', addAttributionRecords, "prov:entity");
    addProvEntityTriplesDbl(store, provObject, ignore, 'associations', 'wasAssociatedWith', addAssociationRecords, "prov:activity");

    addProvEntityTriples(store, provObject, ignore, 'communications', 'wasInformedBy', addCommunicationRecord,  "prov:informed");
    addProvEntityTriples(store, provObject, ignore, 'specializations', 'specializationOf', addGeneralizationRecord,  "prov:specificEntity");

    addProvEntityTriplesDbl(store, provObject, ignore, 'generations', 'wasGeneratedBy', addGenerationsRecords, "prov:entity");
    addProvEntityTriplesDbl(store, provObject, ignore, 'usages', 'used', addUsageRecords, "prov:activity");
    addProvEntityTriplesDbl(store, provObject, ignore, 'derivations', 'wasDerivedFrom', addDerivationRecords, "prov:generatedEntity");
    addProvEntityTriplesDbl(store, provObject, ignore, 'invalidations', 'wasInvalidatedBy', addInvalidationRecords, "prov:entity");

}


function serializePROVO(provObject, ignore, callback){


  //write everything to the triple store
  var store = new n3.Store();

  storeProvInN3(store, provObject, ignore);

  // Now write everything to nice turtle
   callback(getTurtle(store), "text/plain");//TODO: change to RDF

}

/* Serialize the specified PROV-JSON object in PROV-XML */
function serializePROVXML(provObject, ignore, callback){
  callback("serialization unsupported", "text/plain");//TODO: change to text/X
}

exports.serialize = serialize;
exports.shouldBeAdded = shouldBeAdded;
exports.addToJSONBundleIfNeeded = addToJSONBundleIfNeeded;
exports.recordWriters = {};
exports.recordWriters.provN = {};
exports.recordWriters.provN.entity = getEntityRecord;
exports.recordWriters.provN.association = getAssociationsRecord;
exports.recordWriters.provN.attribution = getAttributionRecord;
exports.recordWriters.provN.communication = getCommunicationRecord;
exports.recordWriters.provN.wasStartedBy = getWasStartedByRecord;
exports.recordWriters.provN.specialization = getSpecializationRecord;
exports.recordWriters.provN.generation = getGenerationRecord;
exports.recordWriters.provN.usage = getUsageRecord;
exports.recordWriters.provN.invalidation = getInvalidationRecord;
exports.recordWriters.provN.derivation = getDerivationRecord;
exports.recordWriters.provN.addProvNEntries = addProvNEntries;
exports.recordWriters.provN.addPrefixes = addPrefixes;
exports.recordWriters.provO = {};
exports.recordWriters.provO.addEntities = addProvEntityTriples;
exports.recordWriters.provO.addEntitiesD = addProvEntityTriplesDbl;
exports.recordWriters.provO.addPrefix = addPrefixTriples;
exports.recordWriters.provO.addAltBundle = addAltBundleTriples;
exports.recordWriters.provO.entity = addEntityRecord;
exports.recordWriters.provO.activityStart = addActivityStartedAtRecord;
exports.recordWriters.provO.activityEnd = addActivityEndedAtRecord;
exports.recordWriters.provO.communication = addCommunicationRecord;
exports.recordWriters.provO.generalization = addGeneralizationRecord;
exports.recordWriters.provO.attribution = addAttributionRecords;
exports.recordWriters.provO.association = addAssociationRecords;
exports.recordWriters.provO.generation = addGenerationsRecords;
exports.recordWriters.provO.usage = addUsageRecords;
exports.recordWriters.provO.derivation = addDerivationRecords;
exports.recordWriters.provO.invalidation = addInvalidationRecords;
exports.recordWriters.provO.cmp = cmp;
exports.recordWriters.provO.statementFromTriple = statementFromTriple;
exports.recordWriters.provO.getTurtle = getTurtle;

exports.serializePROVXML = serializePROVXML;
exports.serializePROVJSON = serializePROVJSON;
exports.serializePROVN = serializePROVN;
exports.serializePROVO = serializePROVO;