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

/* Serialize the specified entries as a PROV-JSON object */
function serializePROVJSON(provObject, ignore, callback){
  var bundlename = provObject.bundle;
  var provJSONObject = {};
  provJSONObject["prefix"] = provObject.prefixes;
  provJSONObject["bundle"] = {};
  provJSONObject["bundle"][bundlename] = {};
  if(provObject.entities && ignore.indexOf('entity') < 0 ) {
    provJSONObject["bundle"][bundlename]["entity"] = provObject.entities;
  }
  if(provObject.agents && ignore.indexOf('agent') < 0 ) {
    provJSONObject["bundle"][bundlename]["agent"] = provObject.agents;
  }
  if(provObject.activities && ignore.indexOf('activity') < 0 ) {
    provJSONObject["bundle"][bundlename]["activity"] = provObject.activities;
  }
  if(provObject.starts && ignore.indexOf('wasStartedBy') < 0 ) {
    provJSONObject["bundle"][bundlename]["wasStartedBy"] = provObject.starts;
  }
  if(provObject.ends && ignore.indexOf('wasEndedBy') < 0 ) {
    provJSONObject["bundle"][bundlename]["wasEndedBy"] = provObject.ends;
  }
  if(provObject.attributions && ignore.indexOf('wasAttributedTo') < 0 ) {
    provJSONObject["bundle"][bundlename]["wasAttributedTo"] = provObject.attributions;
  }
  if(provObject.associations && ignore.indexOf('wasAssociatedWith') < 0 ) {
    provJSONObject["bundle"][bundlename]["wasAssociatedWith"] = provObject.associations;
  }
  if(provObject.communications && ignore.indexOf('wasInformedBy') < 0 ) {
    provJSONObject["bundle"][bundlename]["wasInformedBy"] = provObject.communications;
  }
  if(provObject.specializations && ignore.indexOf('specializationOf') < 0 ) {
    provJSONObject["bundle"][bundlename]["specializationOf"] = provObject.specializations;
  }
  if(provObject.generations && ignore.indexOf('wasGeneratedBy') < 0 ) {
    provJSONObject["bundle"][bundlename]["wasGeneratedBy"] = provObject.generations;
  }
  if(provObject.usages && ignore.indexOf('used') < 0 ) {
    provJSONObject["bundle"][bundlename]["used"] = provObject.usages;
  }
  if(provObject.derivations && ignore.indexOf('wasDerivedFrom') < 0 ) {
    provJSONObject["bundle"][bundlename]["wasDerivedFrom"] = provObject.derivations;
  }
  if(provObject.invalidations && ignore.indexOf('wasInvalidatedBy') < 0 ) {
    provJSONObject["bundle"][bundlename]["wasInvalidatedBy"] = provObject.invalidations;
  }
  callback(JSON.stringify(provJSONObject, undefined, 2),"text/plain");//TODO: change to text/json
}

/* Serialize the specified PROV-JSON object in PROV-N */
function serializePROVN(provObject, ignore, callback){
  //write everything to the result string
  var prov = "document" + "\n";
  for (var prefix in provObject.prefixes) {
    if (provObject.prefixes.hasOwnProperty(prefix)) {
      prov += "prefix " + prefix + " <" + provObject.prefixes[prefix] + ">" + "\n";
    }
  }
  prov += "bundle " + provObject.bundle + "\n";
  for (var entity in provObject.entities) {
    if (provObject.entities.hasOwnProperty(entity) && ignore.indexOf('entity') < 0 ) {
      prov += "entity(" + entity + (provObject.entities[entity]["prov:label"]?", [prov:label=\""+provObject.entities[entity]["prov:label"]+"\"]":"") + ")" + "\n";
    }
  }
  for (var agent in provObject.agents) {
    if (provObject.agents.hasOwnProperty(agent) && ignore.indexOf('agent') < 0 ) {
      prov += "agent(" + agent + (provObject.agents[agent]["prov:label"]?", [prov:label=\""+provObject.agents[agent]["prov:label"]+"\"]":"") + ")" + "\n";
    }
  }
  for (var activity in provObject.activities) {
    if (provObject.activities.hasOwnProperty(activity) && ignore.indexOf('activity') < 0 ) {
      prov += "activity(" + activity + (provObject.activities[activity]["prov:label"]?", [prov:label=\""+provObject.activities[activity]["prov:label"]+"\"]":"") + ")" + "\n";
    }
  }
  for (var start in provObject.starts) {
    if (provObject.starts.hasOwnProperty(start) && ignore.indexOf('wasStartedBy') < 0 ) {
      prov += "wasStartedBy(" + provObject.starts[start]["prov:activity"] + ", -, -, " + provObject.starts[start]["prov:time"] + ")" + "\n";
    }
  }
  for (var end in provObject.ends) {
    if (provObject.ends.hasOwnProperty(end) && ignore.indexOf('wasEndedBy') < 0 ) {
      prov += "wasEndedBy(" + provObject.ends[end]["prov:activity"] + ", -, -, " + provObject.ends[end]["prov:time"] + ")" + "\n";
    }
  }
  for (var attribution in provObject.attributions) {
    if (provObject.attributions.hasOwnProperty(attribution) && ignore.indexOf('wasAttributedTo') < 0 ) {
      prov += "wasAttributedTo(" + provObject.attributions[attribution]["prov:entity"] + ", " + provObject.attributions[attribution]["prov:agent"] + ", [prov:type=\"" + provObject.attributions[attribution]["prov:type"] + "\"])" + "\n";
    }
  }
  for (var association in provObject.associations) {
    if (provObject.associations.hasOwnProperty(association) && ignore.indexOf('wasAssociatedWith') < 0 ) {
      prov += "wasAssociatedWith(" + provObject.associations[association]["prov:activity"] + ", " + provObject.associations[association]["prov:agent"] + ", [prov:role=\"" + provObject.associations[association]["prov:role"] + "\"])" + "\n";
    }
  }
  for (var communication in provObject.communications) {
    if (provObject.communications.hasOwnProperty(communication) && ignore.indexOf('wasInformedBy') < 0 ) {
      prov += "wasInformedBy(" + provObject.communications[communication]["prov:informed"] + ", " + provObject.communications[communication]["prov:informant"] + ")" + "\n";
    }
  }
  for (var specialization in provObject.specializations) {
    if (provObject.specializations.hasOwnProperty(specialization) && ignore.indexOf('specializationOf') < 0 ) {
      prov += "specializationOf(" + provObject.specializations[specialization]["prov:specificEntity"] + ", " + provObject.specializations[specialization]["prov:generalEntity"] + ")" + "\n";
    }
  }
  for (var generation in provObject.generations) {
    if (provObject.generations.hasOwnProperty(generation) && ignore.indexOf('wasGeneratedBy') < 0 ) {
      prov += "wasGeneratedBy("+ provObject.generations[generation]["prov:entity"] + ", " + provObject.generations[generation]["prov:activity"] + ", " + provObject.generations[generation]["prov:time"] + ")" + "\n";
    }
  }
  for (var usage in provObject.usages) {
    if (provObject.usages.hasOwnProperty(usage) && ignore.indexOf('used') < 0 ) {
      prov += "used("+ provObject.usages[usage]["prov:activity"] + ", " + provObject.usages[usage]["prov:entity"] + ", " + provObject.usages[usage]["prov:time"] + ")" + "\n";
    }
  }
  for (var derivation in provObject.derivations) {
    if (provObject.derivations.hasOwnProperty(derivation) && ignore.indexOf('wasDerivedFrom') < 0 ) {
      prov += "wasDerivedFrom(" + provObject.derivations[derivation]["prov:generatedEntity"] + ", " + provObject.derivations[derivation]["prov:usedEntity"] + ", " + provObject.derivations[derivation]["prov:activity"] + ", " + provObject.derivations[derivation]["prov:generation"] + ", " + provObject.derivations[derivation]["prov:usage"] + ")" + "\n";
    }
  }
  for (var invalidation in provObject.invalidations) {
    if (provObject.invalidations.hasOwnProperty(invalidation) && ignore.indexOf('wasInvalidatedBy') < 0 ) {
      prov += "wasInvalidatedBy("+ provObject.invalidations[invalidation]["prov:entity"] + ", " + provObject.invalidations[invalidation]["prov:activity"] + ", " + provObject.invalidations[invalidation]["prov:time"] + ")" + "\n";
    }
  }
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
    if (provObject.entities.hasOwnProperty(entity) && ignore.indexOf('entity') < 0 ) {
      store.addTriple(entity, "a", "prov:Entity");
      if(provObject.entities[entity]["prov:label"]) {
          store.addTriple(entity, "rdfs:label", "\"" + provObject.entities[entity]["prov:label"] + "\"@en");
      }
    }
  }
  for (var agent in provObject.agents) {
    if (provObject.agents.hasOwnProperty(agent) && ignore.indexOf('agent') < 0 ) {
      store.addTriple(agent, "a", "prov:Agent");
      if(provObject.agents[agent]["prov:label"]) {
          store.addTriple(agent, "rdfs:label", "\"" + provObject.agents[agent]["prov:label"] + "\"@en");
      }
    }
  }
  for (var activity in provObject.activities) {
    if (provObject.activities.hasOwnProperty(activity) && ignore.indexOf('activity') < 0 ) {
      store.addTriple(activity, "a", "prov:Activity");
      if(provObject.activities[activity]["prov:label"]) {
          store.addTriple(activity, "rdfs:label", "\"" + provObject.activities[activity]["prov:label"] + "\"@en");
      }
    }
  }
  for (var start in provObject.starts) {
    if (provObject.starts.hasOwnProperty(start) && ignore.indexOf('wasStartedBy') < 0 ) {
      store.addTriple(provObject.starts[start]["prov:activity"], "prov:startedAtTime", "\"" + provObject.starts[start]["prov:time"] + "\"^^xsd:dateTime");
    }
  }
  for (var end in provObject.ends) {
    if (provObject.ends.hasOwnProperty(end) && ignore.indexOf('wasEndedBy') < 0 ) {
      store.addTriple(provObject.ends[end]["prov:activity"], "prov:endedAtTime", "\"" + provObject.ends[end]["prov:time"] + "\"^^xsd:dateTime");
    }
  }
  for (var attribution in provObject.attributions) {
    if (provObject.attributions.hasOwnProperty(attribution) && ignore.indexOf('wasAttributedTo') < 0 ) {
      store.addTriple(provObject.attributions[attribution]["prov:entity"], "prov:wasAttributedTo", provObject.attributions[attribution]["prov:agent"]);
      if(provObject.attributions[attribution]["prov:type"]) {
          store.addTriple(provObject.attributions[attribution]["prov:entity"], "prov:qualifiedAttribution", "[ a prov:Attribution ; prov:agent " + provObject.attributions[attribution]["prov:agent"] + " ; a \"" + provObject.attributions[attribution]["prov:type"] + "\"@en ]");
      }
        //TODO: format this better
    }
  }
  for (var association in provObject.associations) {
    if (provObject.associations.hasOwnProperty(association) && ignore.indexOf('wasAssociatedWith') < 0 ) {
      store.addTriple(provObject.associations[association]["prov:activity"], "prov:wasAssociatedWith", provObject.associations[association]["prov:agent"]);
      if(provObject.associations[association]["prov:role"]) {
          store.addTriple(provObject.associations[association]["prov:activity"], "prov:qualifiedAssociation", "[ a prov:Association ; prov:agent " + provObject.associations[association]["prov:agent"] + " ; prov:hadRole \"" + provObject.associations[association]["prov:role"] + "\"@en ]");
      }
        //TODO: format this better
    }
  }
  for (var communication in provObject.communications) {
    if (provObject.communications.hasOwnProperty(communication) && ignore.indexOf('wasInformedBy') < 0 ) {
      store.addTriple(provObject.communications[communication]["prov:informed"], "prov:wasInformedBy", provObject.communications[communication]["prov:informant"]);
    }
  }
  for (var specialization in provObject.specializations) {
    if (provObject.specializations.hasOwnProperty(specialization) && ignore.indexOf('specializationOf') < 0 ) {
      store.addTriple(provObject.specializations[specialization]["prov:specificEntity"], "prov:specializationOf", provObject.specializations[specialization]["prov:generalEntity"]);
    }
  }
  for (var generation in provObject.generations) {
    if (provObject.generations.hasOwnProperty(generation) && ignore.indexOf('wasGeneratedBy') < 0 ) {
      store.addTriple(provObject.generations[generation]["prov:entity"], "prov:wasGeneratedBy", provObject.generations[generation]["prov:activity"]);
      if(provObject.generations[generation]["prov:time"]) {
          store.addTriple(provObject.generations[generation]["prov:entity"], "prov:qualifiedGeneration", "[ a prov:Generation ; prov:activity " + provObject.generations[generation]["prov:activity"] + " ; prov:atTime \"" + provObject.generations[generation]["prov:time"] + "\"^^xsd:dateTime ]");
      }
        //TODO: format this better
    }
  }
  for (var usage in provObject.usages) {
    if (provObject.usages.hasOwnProperty(usage) && ignore.indexOf('used') < 0 ) {
      store.addTriple(provObject.usages[usage]["prov:activity"], "prov:used", provObject.usages[usage]["prov:entity"]);
      if(provObject.usages[usage]["prov:time"]) {
          store.addTriple(provObject.usages[usage]["prov:activity"], "prov:qualifiedUsage", "[ a prov:Usage ; prov:entity " + provObject.usages[usage]["prov:entity"] + " ; prov:atTime \"" + provObject.usages[usage]["prov:time"] + "\"^^xsd:dateTime ]");
      }
        //TODO: format this better
    }
  }
  for (var derivation in provObject.derivations) {
    if (provObject.derivations.hasOwnProperty(derivation) && ignore.indexOf('wasDerivedFrom') < 0 ) {
      store.addTriple(provObject.derivations[derivation]["prov:generatedEntity"], "prov:wasDerivedFrom", provObject.derivations[derivation]["prov:usedEntity"]);
      if(provObject.derivations[derivation]["prov:generation"] && provObject.derivations[derivation]["prov:usage"] && provObject.derivations[derivation]["prov:activity"]) {
          store.addTriple(provObject.derivations[derivation]["prov:generatedEntity"], "prov:qualifiedDerivation", "[ a prov:Derivation ; prov:entity " + provObject.derivations[derivation]["prov:usedEntity"] + " ; prov:hadGeneration " + provObject.derivations[derivation]["prov:generation"] + " ; prov:hadUsage " + provObject.derivations[derivation]["prov:usage"] + " ; prov:hadActivity " + provObject.derivations[derivation]["prov:activity"] + " ]");
      }
        //TODO: format this better
    }
  }
  for (var invalidation in provObject.invalidations) {
    if (provObject.invalidations.hasOwnProperty(invalidation) && ignore.indexOf('wasInvalidatedBy') < 0 ) {
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
