/* A module that has functions to serialize arrays of data into PROV-N, PROV-O or PROV-XML */


/* Serialize the specified entries in the specified serialization (default: PROV-N) */
function serialize(serialization, prefix, prefixUrl, repository, entities, activities, agents, specializations, derivations, callback){
  switch(serialization) {
    case "PROV-JSON":
      serializePROVJSON(prefix, prefixUrl, repository, entities, activities, agents, specializations, derivations, callback);
      break;
    case "PROV-O":
      serializePROVO(prefix, prefixUrl, repository, entities, activities, agents, specializations, derivations, callback);
      break;
    case "PROV-XML":
      serializePROVXML(prefix, prefixUrl, repository, entities, activities, agents, specializations, derivations, callback);
      break;
    default:
      serializePROVN(prefix, prefixUrl, repository, entities, activities, agents, specializations, derivations, callback);
  }
}

/* Serialize the specified entries as a PROV-JSON object */
function serializePROVJSON(prefix, prefixUrl, repository, entities, activities, agents, specializations, derivations, callback){
  var bundlename = prefix + ":" + repository;
  var provObject = {
    "prefix" : {prefix:prefixUrl},
    "bundle" : {
    }
  };
  provObject["bundle"][bundlename] = {};
  if(entities) {
    provObject["bundle"][bundlename]["entity"] = {};
    entities.forEach(function(entity){
      provObject["bundle"][bundlename]["entity"][entity] = {};
    });
  }
  if(activities) {
    provObject["bundle"][bundlename]["activity"] = {};
    activities.forEach(function(activity){
      provObject["bundle"][bundlename]["activity"][activity] = {};
    });
  }
  if(agents) {
    provObject["bundle"][bundlename]["agent"] = {};
    agents.forEach(function(agent){
      provObject["bundle"][bundlename]["agent"][agent] = {};
    });
  }
  if(specializations) {
    provObject["bundle"][bundlename]["specializationOf"] = {};
    specializations.forEach(function(specialization){
      provObject["bundle"][bundlename]["specializationOf"][specialization] = {};
    });
  }
  if(derivations) {
    provObject["bundle"][bundlename]["wasDerivedFrom"] = {};
    derivations.forEach(function(derivation){
      provObject["bundle"][bundlename]["wasDerivedFrom"][derivation] = {};
    });
  }
  callback(JSON.stringify(provObject, undefined, 2),"text/plain");
}

/* Serialize the specified PROV-JSON object in PROV-N */
function serializePROVN(prefix, prefixUrl, repository, entities, activities, agents, specializations, derivations, callback){
  //write everything to the result string
  var prov = "document" + "\n";
  prov += "prefix " + prefix + " <" + prefixUrl + ">" + "\n";
  prov += "bundle " + prefix + ":" + repository + "\n";
  entities.forEach(function(entity) {
      prov += "entity(" + entity + ")" + "\n";
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