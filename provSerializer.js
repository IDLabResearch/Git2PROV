/* A module that has functions to serialize arrays of data into PROV-N, PROV-O or PROV-XML */


/* Serialize the specified entries in the specified serialization (default: PROV-N) */
function serialize(serialization, prefix, prefixUrl, repository, entities, activities, agents, specializations, derivations, starts, ends, attributions, associations, callback){
  switch(serialization) {
    case "PROV-JSON":
      serializePROVJSON(prefix, prefixUrl, repository, entities, activities, agents, specializations, derivations, starts, ends, attributions, associations, callback);
      break;
    case "PROV-O":
      serializePROVO(prefix, prefixUrl, repository, entities, activities, agents, specializations, derivations, starts, ends, attributions, associations, callback);
      break;
    case "PROV-XML":
      serializePROVXML(prefix, prefixUrl, repository, entities, activities, agents, specializations, derivations, starts, ends, attributions, associations, callback);
      break;
    default:
      serializePROVN(prefix, prefixUrl, repository, entities, activities, agents, specializations, derivations, starts, ends, attributions, associations, callback);
  }
}

/* Serialize the specified entries as a PROV-JSON object */
function serializePROVJSON(prefix, prefixUrl, repository, entities, activities, agents, specializations, derivations, starts, ends, attributions, associations, callback){
  var bundlename = prefix + ":" + repository;
  var provObject = {
    "prefix" : {prefix:prefixUrl},
    "bundle" : {
    }
  };
  provObject["bundle"][bundlename] = {};
  if(entities) {
    provObject["bundle"][bundlename]["entity"] = entities;
  }
  if(activities) {
    provObject["bundle"][bundlename]["activity"] = activities;
  }
  if(agents) {
    provObject["bundle"][bundlename]["agent"] = agents;
  }
  if(specializations) {
    provObject["bundle"][bundlename]["specializationOf"] = specializations;
  }
  if(derivations) {
    provObject["bundle"][bundlename]["wasDerivedFrom"] = derivations;
  }
  if(starts) {
    provObject["bundle"][bundlename]["wasStartedBy"] = starts;
  }
  if(ends) {
    provObject["bundle"][bundlename]["wasEndedBy"] = ends;
  }
  if(attributions) {
    provObject["bundle"][bundlename]["wasAttributedTo"] = attributions;
  }
  if(associations) {
    provObject["bundle"][bundlename]["wasAssociatedWith"] = associations;
  }
  callback(JSON.stringify(provObject, undefined, 2),"text/plain");
}

/* Serialize the specified PROV-JSON object in PROV-N */
function serializePROVN(prefix, prefixUrl, repository, entities, activities, agents, specializations, derivations, starts, ends, attributions, associations, callback){
  //write everything to the result string
  var prov = "document" + "\n";
  prov += "prefix " + prefix + " <" + prefixUrl + ">" + "\n";
  prov += "bundle " + prefix + ":" + repository + "\n";
  if(entities) 
    entities.forEach(function(entity) {
        prov += "entity(" + entity + ")" + "\n";
    });
  if(activities) 
    activities.forEach(function(activity) {
        prov += "activity(" + activity + ")" + "\n";
    });
  if(agents) 
    agents.forEach(function(agent) {
        prov += "agent(" + agent + ")" + "\n";
    });
  if(specializations) 
    specializations.forEach(function(specialization) {
        prov += "specializationOf(" + specialization["prov:specificEntity"] + "," + specialization["prov:generalEntity"] + ")" + "\n";
    });
  if(derivations) 
    derivations.forEach(function(derivation) {
        prov += "wasDerivedFrom(" + derivation["prov:generatedEntity"] + "," + derivation["prov:usedEntity"] + ")" + "\n";
    });
  prov += "endBundle " + "\n";
  prov += "endDocument" + "\n";
  callback(prov,"text/plain");
}

/* Serialize the specified PROV-JSON object in PROV-O */
function serializePROVO(prefix, prefixUrl, repository, entities, activities, agents, specializations, derivations, callback){
  callback();
}

/* Serialize the specified PROV-JSON object in PROV-XML */
function serializePROVXML(prefix, prefixUrl, repository, entities, activities, agents, specializations, derivations, callback){
  callback();
}

exports.serialize = serialize;