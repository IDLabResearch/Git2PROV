/* A module that has functions to serialize arrays of data into PROV-N, PROV-O or PROV-XML */


/* Serialize the specified entries in the specified serialization (default: PROV-N) */
function serialize(serialization, provObject, repository, callback){
  switch(serialization) {
    case "PROV-JSON":
      serializePROVJSON(provObject, repository, callback);
      break;
    case "PROV-O":
      serializePROVO(provObject, repository, callback);
      break;
    case "PROV-XML":
      serializePROVXML(provObject, repository, callback);
      break;
    default:
      serializePROVN(provObject, repository, callback);
  }
}

/* Serialize the specified entries as a PROV-JSON object */
function serializePROVJSON(provObject, repository, callback){
  var bundlename = "repository:" + repository;
  var provJSONObject = {};
  provJSONObject["prefix"] = provObject.prefixes;
  provJSONObject["bundle"] = {};
  provJSONObject["bundle"][bundlename] = {};
  if(provObject.entities) {
    provJSONObject["bundle"][bundlename]["entity"] = provObject.entities;
  }
  if(provObject.activities) {
    provJSONObject["bundle"][bundlename]["activity"] = provObject.activities;
  }
  if(provObject.agents) {
    provJSONObject["bundle"][bundlename]["agent"] = provObject.agents;
  }
  if(provObject.specializations) {
    provJSONObject["bundle"][bundlename]["specializationOf"] = provObject.specializations;
  }
  if(provObject.derivations) {
    provJSONObject["bundle"][bundlename]["wasDerivedFrom"] = provObject.derivations;
  }
  if(provObject.starts) {
    provJSONObject["bundle"][bundlename]["wasStartedBy"] = provObject.starts;
  }
  if(provObject.ends) {
    provJSONObject["bundle"][bundlename]["wasEndedBy"] = provObject.ends;
  }
  if(provObject.attributions) {
    provJSONObject["bundle"][bundlename]["wasAttributedTo"] = provObject.attributions;
  }
  if(provObject.associations) {
    provJSONObject["bundle"][bundlename]["wasAssociatedWith"] = provObject.associations;
  }
  if(provObject.generations) {
    provJSONObject["bundle"][bundlename]["wasGeneratedBy"] = provObject.generations;
  }
  if(provObject.invalidations) {
    provJSONObject["bundle"][bundlename]["wasInvalidatedBy"] = provObject.invalidations;
  }
  callback(JSON.stringify(provJSONObject, undefined, 2),"text/plain");//TODO: change to text/json
}

/* Serialize the specified PROV-JSON object in PROV-N */
function serializePROVN(provObject, repository, callback){
  //write everything to the result string
  var prov = "document" + "\n";
  for (var prefix in provObject.prefixes) {
    if (provObject.prefixes.hasOwnProperty(prefix)) {
      prov += "prefix " + prefix + " <" + provObject.prefixes[prefix] + ">" + "\n";
    }
  }
  prov += "bundle repository:" + repository + "\n";
  for (var entity in provObject.entities) {
    if (provObject.entities.hasOwnProperty(entity)) {
      prov += "entity(" + entity + (provObject.entities[entity]["prov:label"]?", [prov:label=\""+provObject.entities[entity]["prov:label"]+"\"]":"") + ")" + "\n";
    }
  }
  for (var activity in provObject.activities) {
    if (provObject.activities.hasOwnProperty(activity)) {
      prov += "activity(" + activity + (provObject.activities[activity]["prov:label"]?", [prov:label=\""+provObject.activities[activity]["prov:label"]+"\"]":"") + ")" + "\n";
    }
  }
  for (var agent in provObject.agents) {
    if (provObject.agents.hasOwnProperty(agent)) {
      prov += "agent(" + agent + (provObject.agents[agent]["prov:label"]?", [prov:label=\""+provObject.agents[agent]["prov:label"]+"\"]":"") + ")" + "\n";
    }
  }
  for (var specialization in provObject.specializations) {
    if (provObject.specializations.hasOwnProperty(specialization)) {
      prov += "specializationOf(" + provObject.specializations[specialization]["prov:specificEntity"] + "," + provObject.specializations[specialization]["prov:generalEntity"] + ")" + "\n";
    }
  }
  for (var derivation in provObject.derivations) {
    if (provObject.derivations.hasOwnProperty(derivation)) {
      prov += "wasDerivedFrom(" + provObject.derivations[derivation]["prov:generatedEntity"] + "," + provObject.derivations[derivation]["prov:usedEntity"] + ")" + "\n";
    }
  }
  for (var start in provObject.starts) {
    if (provObject.starts.hasOwnProperty(start)) {
      prov += "wasStartedBy(" + provObject.starts[start]["prov:activity"] + ", -, -, " + provObject.starts[start]["prov:time"] + ")" + "\n";
    }
  }
  for (var end in provObject.ends) {
    if (provObject.ends.hasOwnProperty(end)) {
      prov += "wasStartedBy(" + provObject.ends[end]["prov:activity"] + ", -, -, " + provObject.ends[end]["prov:time"] + ")" + "\n";
    }
  }
  for (var attribution in provObject.attributions) {
    if (provObject.attributions.hasOwnProperty(attribution)) {
      prov += "wasAttributedTo(" + provObject.attributions[attribution]["prov:entity"] + ", " + provObject.attributions[attribution]["prov:agent"] + ", [prov:type=\"" + provObject.attributions[attribution]["prov:type"] + "\"])" + "\n";
    }
  }
  for (var association in provObject.associations) {
    if (provObject.associations.hasOwnProperty(association)) {
      prov += "wasAssociatedWith(" + provObject.associations[association]["prov:activity"] + ", " + provObject.associations[association]["prov:agent"] + ", [prov:role=\"" + provObject.associations[association]["prov:role"] + "\"])" + "\n";
    }
  }
  for (var generation in provObject.generations) {
    if (provObject.generations.hasOwnProperty(generation)) {
      prov += "wasGeneratedBy("+ provObject.generations[generation]["prov:entity"] + ", " + provObject.generations[generation]["prov:activity"] + ", " + provObject.generations[generation]["prov:time"] + ")" + "\n";
    }
  }
  for (var invalidation in provObject.invalidations) {
    if (provObject.invalidations.hasOwnProperty(invalidation)) {
      prov += "wasInvalidatedBy("+ provObject.invalidations[invalidation]["prov:entity"] + ", " + provObject.invalidations[invalidation]["prov:activity"] + ", " + provObject.invalidations[invalidation]["prov:time"] + ")" + "\n";
    }
  }
  prov += "endBundle " + "\n";
  prov += "endDocument" + "\n";
  callback(prov,"text/plain");//TODO: change to text/prov-notation
}

/* Serialize the specified PROV-JSON object in PROV-O */
function serializePROVO(provObject, repository, callback){
  callback("serialization unsupported","text/plain");//TODO: change to RDF
}

/* Serialize the specified PROV-JSON object in PROV-XML */
function serializePROVXML(provObject, repository, callback){
  callback("serialization unsupported","text/plain");//TODO: change to text/X
}

exports.serialize = serialize;