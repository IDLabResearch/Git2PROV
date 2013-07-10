/* A module that has functions to serialize arrays of data into PROV-N, PROV-O or PROV-XML */


/* Serialize the specified entries in the specified serialization (default: PROV-N) */
function serialize(serialization, provObject, repository, ignore, callback){
  switch(serialization) {
    case "PROV-JSON":
      serializePROVJSON(provObject, repository, ignore, callback);
      break;
    case "PROV-O":
      serializePROVO(provObject, repository, ignore, callback);
      break;
    case "PROV-XML":
      serializePROVXML(provObject, repository, ignore, callback);
      break;
    default:
      serializePROVN(provObject, repository, ignore, callback);
  }
}

/* Serialize the specified entries as a PROV-JSON object */
function serializePROVJSON(provObject, repository, ignore, callback){
  var bundlename = "repository:" + repository;
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
function serializePROVN(provObject, repository, ignore, callback){
  //write everything to the result string
  var prov = "document" + "\n";
  for (var prefix in provObject.prefixes) {
    if (provObject.prefixes.hasOwnProperty(prefix)) {
      prov += "prefix " + prefix + " <" + provObject.prefixes[prefix] + ">" + "\n";
    }
  }
  prov += "bundle repository:" + repository + "\n";
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
function serializePROVO(provObject, repository, ignore, callback){
  callback("serialization unsupported", "text/plain");//TODO: change to RDF
}

/* Serialize the specified PROV-JSON object in PROV-XML */
function serializePROVXML(provObject, repository, ignore, callback){
  callback("serialization unsupported", "text/plain");//TODO: change to text/X
}

exports.serialize = serialize;