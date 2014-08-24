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
        provJSONObject["bundle"][bundlename][attrSingular] = provSet;
    }
}


/* Serialize the specified entries as a PROV-JSON object */
function serializePROVJSON(provObject, ignore, callback){

  var provJSONObject = {};
  provJSONObject["prefix"] = provObject.prefixes;
  provJSONObject["bundle"] = {};
  provJSONObject["bundle"][provObject.bundle] = {};

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

/* Serialize the specified PROV-JSON object in PROV-O */
function serializePROVO(provObject, ignore, callback){
  //write everything to the triple store
  var store = new n3.Store();
  store.addTriple("@prefix", "prov:" ,"<http://www.w3.org/ns/prov#>");
  store.addTriple("@prefix", "rdfs:", "<http://www.w3.org/2000/01/rdf-schema#>");
  store.addTriple("@prefix", "xsd:", "<http://www.w3.org/2001/XMLSchema#>");
  if(provObject.bundle){
    store.addTriple(provObject.bundle, "a", "prov:Bundle");
    if(provObject.alternateBundle){
      store.addTriple(provObject.bundle, "prov:alternateOf", provObject.alternateBundle);
    }
  }
  for (var prefix in provObject.prefixes) {
    if (provObject.prefixes.hasOwnProperty(prefix)) {
      store.addTriple("@prefix", prefix + ":", "<" + provObject.prefixes[prefix] + ">");
    }
  }
  for (var entity in provObject.entities) {
    if (shouldBeAdded(provObject.entities, ignore, entity, 'entity') ) {
      store.addTriple(entity, "a", "prov:Entity");
      if(provObject.entities[entity]["prov:label"]) {
          store.addTriple(entity, "rdfs:label", "\"" + provObject.entities[entity]["prov:label"] + "\"@en");
      }
    }
  }
  for (var agent in provObject.agents) {
    if (shouldBeAdded(provObject.agents, ignore, agent, 'agent')) {
      store.addTriple(agent, "a", "prov:Agent");
      if(provObject.agents[agent]["prov:label"]) {
          store.addTriple(agent, "rdfs:label", "\"" + provObject.agents[agent]["prov:label"] + "\"@en");
      }
    }
  }
  for (var activity in provObject.activities) {
    if (shouldBeAdded(provObject.activities, ignore, activity, 'activity')) {
      store.addTriple(activity, "a", "prov:Activity");
      if(provObject.activities[activity]["prov:label"]) {
          store.addTriple(activity, "rdfs:label", "\"" + provObject.activities[activity]["prov:label"] + "\"@en");
      }
    }
  }
  for (var start in provObject.starts) {
    if (shouldBeAdded(provObject.starts, ignore, start, 'wasStartedBy')) {
      store.addTriple(provObject.starts[start]["prov:activity"], "prov:startedAtTime", "\"" + provObject.starts[start]["prov:time"] + "\"^^xsd:dateTime");
    }
  }
  for (var end in provObject.ends) {
    if (shouldBeAdded(provObject.ends, ignore, end, 'wasEndedBy'))  {
      store.addTriple(provObject.ends[end]["prov:activity"], "prov:endedAtTime", "\"" + provObject.ends[end]["prov:time"] + "\"^^xsd:dateTime");
    }
  }
  for (var attribution in provObject.attributions) {
    if (shouldBeAdded(provObject.attributions, ignore, attribution, 'wasAttributedTo'))  {
      store.addTriple(provObject.attributions[attribution]["prov:entity"], "prov:wasAttributedTo", provObject.attributions[attribution]["prov:agent"]);
      if(provObject.attributions[attribution]["prov:type"]) {
          store.addTriple(provObject.attributions[attribution]["prov:entity"], "prov:qualifiedAttribution", "[ a prov:Attribution ; prov:agent " + provObject.attributions[attribution]["prov:agent"] + " ; a \"" + provObject.attributions[attribution]["prov:type"] + "\"@en ]");
      }
        //TODO: format this better
    }
  }
  for (var association in provObject.associations) {
    if (shouldBeAdded(provObject.associations, ignore, association, 'wasAssociatedWith')) {
      store.addTriple(provObject.associations[association]["prov:activity"], "prov:wasAssociatedWith", provObject.associations[association]["prov:agent"]);
      if(provObject.associations[association]["prov:role"]) {
          store.addTriple(provObject.associations[association]["prov:activity"], "prov:qualifiedAssociation", "[ a prov:Association ; prov:agent " + provObject.associations[association]["prov:agent"] + " ; prov:hadRole \"" + provObject.associations[association]["prov:role"] + "\"@en ]");
      }
        //TODO: format this better
    }
  }
  for (var communication in provObject.communications) {
    if (shouldBeAdded(provObject.communications, ignore, communication, 'wasInformedBy')) {
      store.addTriple(provObject.communications[communication]["prov:informed"], "prov:wasInformedBy", provObject.communications[communication]["prov:informant"]);
    }
  }
  for (var specialization in provObject.specializations) {
    if (shouldBeAdded(provObject.specializations, ignore, specialization, 'specializationOf')) {
      store.addTriple(provObject.specializations[specialization]["prov:specificEntity"], "prov:specializationOf", provObject.specializations[specialization]["prov:generalEntity"]);
    }
  }
  for (var generation in provObject.generations) {
    if (shouldBeAdded(provObject.generations, ignore, generation, 'wasGeneratedBy')) {
      store.addTriple(provObject.generations[generation]["prov:entity"], "prov:wasGeneratedBy", provObject.generations[generation]["prov:activity"]);
      if(provObject.generations[generation]["prov:time"]) {
          store.addTriple(provObject.generations[generation]["prov:entity"], "prov:qualifiedGeneration", "[ a prov:Generation ; prov:activity " + provObject.generations[generation]["prov:activity"] + " ; prov:atTime \"" + provObject.generations[generation]["prov:time"] + "\"^^xsd:dateTime ]");
      }
        //TODO: format this better
    }
  }
  for (var usage in provObject.usages) {
    if (shouldBeAdded(provObject.usages, ignore, usage, 'used')) {
      store.addTriple(provObject.usages[usage]["prov:activity"], "prov:used", provObject.usages[usage]["prov:entity"]);
      if(provObject.usages[usage]["prov:time"]) {
          store.addTriple(provObject.usages[usage]["prov:activity"], "prov:qualifiedUsage", "[ a prov:Usage ; prov:entity " + provObject.usages[usage]["prov:entity"] + " ; prov:atTime \"" + provObject.usages[usage]["prov:time"] + "\"^^xsd:dateTime ]");
      }
        //TODO: format this better
    }
  }
  for (var derivation in provObject.derivations) {
    if (shouldBeAdded(provObject.derivations, ignore, derivation, 'wasDerivedFrom')) {
      store.addTriple(provObject.derivations[derivation]["prov:generatedEntity"], "prov:wasDerivedFrom", provObject.derivations[derivation]["prov:usedEntity"]);
      if(provObject.derivations[derivation]["prov:generation"] && provObject.derivations[derivation]["prov:usage"] && provObject.derivations[derivation]["prov:activity"]) {
          store.addTriple(provObject.derivations[derivation]["prov:generatedEntity"], "prov:qualifiedDerivation", "[ a prov:Derivation ; prov:entity " + provObject.derivations[derivation]["prov:usedEntity"] + " ; prov:hadGeneration " + provObject.derivations[derivation]["prov:generation"] + " ; prov:hadUsage " + provObject.derivations[derivation]["prov:usage"] + " ; prov:hadActivity " + provObject.derivations[derivation]["prov:activity"] + " ]");
      }
        //TODO: format this better
    }
  }
  for (var invalidation in provObject.invalidations) {
    if (shouldBeAdded(provObject.invalidations, ignore, invalidation, 'wasInvalidatedBy'))  {
      store.addTriple(provObject.invalidations[invalidation]["prov:entity"], "prov:wasInvalidatedBy", provObject.invalidations[invalidation]["prov:activity"]);
      if(provObject.invalidations[invalidation]["prov:time"]) {
          store.addTriple(provObject.invalidations[invalidation]["prov:entity"], "prov:qualifiedInvalidation", "[ a prov:Invalidation ; prov:activity " + provObject.invalidations[invalidation]["prov:activity"] + " ; prov:atTime \"" + provObject.invalidations[invalidation]["prov:time"] + "\"^^xsd:dateTime ]");
      }
        //TODO: format this better
    }
  }
  // Now write everything to nice turtle
  var provo = "";
  var triples = store.find();
  triples = triples.sort(function (a,b) { 
    function cmp(a,b, prop){
       return (a.toLowerCase() > b.toLowerCase()) ? 1 : ((a.toLowerCase() < b.toLowerCase()) ? -1 : 0);
    }
    return cmp(a.subject,b.subject) || cmp(a.predicate,b.predicate) || cmp(a.object,b.object); 
  });
  var previousTriple = {};
  var count = 0;
  triples.forEach(function(triple){
    if(triple.subject === "@prefix"){
      // For prefixes, always rewrite the subject
      provo += triple.subject + " " + triple.predicate + " " + triple.object + " .\n";
    } else {
      // For all other triples, don't re-write the subject/predicate when it's the same as the previous
      var a = previousTriple.subject === triple.subject;
      var b = previousTriple.predicate === triple.predicate;
      provo += ((count > 0)?(a?(b?",":";"):".") + "\n":"") + (a?"\t":triple.subject) + "\t" + ((a && b)?"\t":triple.predicate) + "\t" + triple.object + " ";
      count++;
    }
    previousTriple = triple;
  });
  provo += ".";
  callback(provo, "text/plain");//TODO: change to RDF
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
