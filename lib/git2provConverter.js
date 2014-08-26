"use strict";

/* A converter for a git url to PROV-N */
var exec = require('child_process').exec;
var serialize = require('./provSerializer').serialize;

/* Convert the git repository at giturl to PROV in the specified serialization.
   RepositoryPath will be used to temporarily store the cloned repository on the server. 
*/
function convert(giturl, serialization, repositoryPath, requestUrl, options, callback) {
  // Convert git URLs to https URLs 
  if(giturl.indexOf("git@github.com:") > -1) {
      giturl = giturl.replace("git@github.com:", "https://github.com/");
  }
  // get the repository name. 
  var repository = giturl.substring(giturl.lastIndexOf('/')+1, giturl.lastIndexOf('.git'));
  // clone the git repository
  clone(giturl, repositoryPath, function(error) {
    if (error !== null){
      callback(null, error);
      // cleanup - delete the repository
      exec("rm -rf " + repositoryPath);
    } else {
      // convert the information from the git url to PROV
      convertRepositoryToProv(repositoryPath, serialization, requestUrl, options, function(prov,contentType){
        callback(prov,null,contentType);
        // cleanup - delete the repository
        exec("rm -rf " + repositoryPath);
      });
    }
  });
}

/* Clone a git repository (at giturl) to the specified repositoryPath on the server */
function clone(giturl, repositoryPath, callback) {
  exec('git clone '+ giturl + ' ' + repositoryPath, { timeout : 30000 },function (error) {
    if( error !== null ) { 
      callback(error);
    } else {
      callback(null);
    }
  });
}

function getProvObject(prefixes, urlprefix) {
    var provObject = {};
    provObject.prefixes = prefixes;
    provObject.bundle = urlprefix + ":provenance";
    provObject.alternateBundle = "fullResult:provenance";
    provObject.entities = {};
    provObject.agents = {};
    provObject.activities = {};
    provObject.starts = {};
    provObject.ends = {};
    provObject.attributions = {};
    provObject.associations = {};
    provObject.communications = {};
    provObject.specializations = {};
    provObject.usages = {};
    provObject.generations = {};
    provObject.derivations = {};
    provObject.invalidations = {};
    return provObject;
}

function getCommitObj(line) {

    // remove the trailing filename from the --name-status line
    line = line.substring(0, line.lastIndexOf(',') + 2);

    var commitObj = {};
    var data = line.split(",");

    commitObj.entity = "file-" + data[0];
    commitObj.id = "commit-" + data[1];
    commitObj.parents = data[2] ? data[2].split(" ") : [];
    commitObj.author = "user-" + data[3].replace(/ /g, "-");
    commitObj.author_label = data[3];
    commitObj.author_date = new Date(data[4]).toISOString();
    commitObj.commiter = "user-" + data[5].replace(/ /g, "-");
    commitObj.commiter_label = data[5];
    commitObj.commiter_date = new Date(data[6]).toISOString();
    commitObj.subject = data[7];
    commitObj.modification_type = data[8];
    return commitObj;
}

function updateProvObj(provObject, urlprefix, commitObj){

    var commitEntity = commitObj.entity + "_" + commitObj.id;


    // Add the commit activity to the activities object
    provObject.activities[urlprefix + ":" + commitObj.id] = {"prov:label" : commitObj.subject};// No need to add the parents as well, since we will eventually loop over them anyway
    provObject.starts[urlprefix + ":" + commitObj.id + "_start"] ={
        "prov:activity" : urlprefix + ":" + commitObj.id, "prov:time" : commitObj.author_date};
    provObject.ends[urlprefix + ":" + commitObj.id + "_end"] = {
        "prov:activity" : urlprefix + ":" + commitObj.id, "prov:time" : commitObj.commiter_date};
    // Add the commit entities (files) to the entities, specializations and derivations object
    provObject.entities[urlprefix + ":" + commitEntity] = {};
    provObject.specializations[urlprefix + ":" + commitEntity + "_spec"] = {
        "prov:generalEntity" : urlprefix + ":" + commitObj.entity,
        "prov:specificEntity" : urlprefix + ":" + commitEntity};
    switch(commitObj.modification_type){
        case "D":
            // The file was deleted in this commit
            provObject.invalidations[urlprefix + ":" + commitEntity + "_inv"] = {
                "prov:entity": urlprefix + ":" + commitEntity,
                "prov:activity": urlprefix + ":" + commitObj.id,
                "prov:time": commitObj.author_date
            };
            break;
        case "A":
            // The file was added in this commit
            provObject.generations[urlprefix + ":" + commitEntity + "_gen"] = {
                "prov:entity": urlprefix + ":" + commitEntity,
                "prov:activity": urlprefix + ":" + commitObj.id,
                "prov:time": commitObj.author_date
            };
            break;
        default:
            // The file was modified in this commit
            var generation = urlprefix + ":" + commitEntity + "_gen";
            provObject.generations[generation] = {
                "prov:activity": urlprefix + ":" + commitObj.id,
                "prov:entity": urlprefix + ":" + commitEntity,
                "prov:time": commitObj.author_date
            };

            commitObj.parents.forEach(function(parent){
                if(parent !== ""){
                    var parentEntity = commitObj.entity + "_commit-" + parent;
                    var usage = urlprefix + ":" + parentEntity + "_" + commitObj.id + "_use";
                    provObject.usages[usage] = {
                        "prov:activity": urlprefix + ":" + commitObj.id,
                        "prov:entity": urlprefix + ":" + parentEntity,
                        "prov:time": commitObj.author_date
                    };
                    provObject.derivations[urlprefix + ":" + commitEntity + "_" + parent + "_der"] = {
                        "prov:activity": urlprefix + ":" + commitObj.id,
                        "prov:generatedEntity": urlprefix + ":" + commitEntity,
                        "prov:usedEntity": urlprefix + ":" + parentEntity,
                        "prov:generation": generation,
                        "prov:usage": usage
                    };
                    provObject.communications[urlprefix + ":" + commitObj.id + "_" + parent + "_comm"] = {
                        "prov:informant": urlprefix + ":" + "commit-" + parent,
                        "prov:informed": urlprefix + ":" + commitObj.id
                    };
                }
            });
            break;
    }
    // Add the agents to the stack of agents
    provObject.agents[urlprefix + ":" + commitObj.author] = {"prov:label" : commitObj.author_label};
    // The file is definitly attributed to the author
    provObject.attributions[urlprefix + ":" + commitObj.entity + "_" + commitObj.id + "_" + commitObj.author + "_attr"] = {
        "prov:entity" : urlprefix + ":" + commitEntity,
        "prov:agent" : urlprefix + ":" + commitObj.author,
        "prov:type" : "authorship"
    };
    // And he/she is definitely associated with the commit activity
    provObject.associations[urlprefix + ":" + commitObj.id + "_" + commitObj.author + "_assoc"] = {
        "prov:activity" : urlprefix + ":" + commitObj.id,
        "prov:agent" : urlprefix + ":" + commitObj.author,
        "prov:role" : "author"
    };
    provObject.agents[urlprefix + ":" + commitObj.commiter] = {"prov:label" : commitObj.commiter_label};
    // We can't say that the file was attributed to the committer, but we can associate the commit activity with him/her
    if(provObject.associations[urlprefix + ":" + commitObj.id + "_" + commitObj.commiter + "_assoc"]){
        provObject.associations[urlprefix + ":" + commitObj.id + "_" + commitObj.commiter + "_assoc"]["prov:role"] += ", committer";
    } else {
        provObject.associations[urlprefix + ":" + commitObj.id + "_" + commitObj.commiter + "_assoc"] = {
            "prov:activity" : urlprefix + ":" + commitObj.id,
            "prov:agent" : urlprefix + ":" + commitObj.commiter,
            "prov:role" : "committer"
        };
    }
}

function getPrefixes(urlprefix, requestUrl, serialization) {
    var prefixes = {};
    prefixes[urlprefix] = requestUrl + "#";
    prefixes.fullResult = requestUrl.substring(0, requestUrl.indexOf('&')) + "&serialization=" + serialization + "#";
    return prefixes;
}

function getLogCmds(provObject, fileList, urlprefix, options) {

    var files = fileList.toString().split('\n');
    // For some reason, git log appends empty lines here and there. Let's fitler them out.
    files = files.filter(function(element) { return element !== ""; });

    var logCmds = files.map(function (file) {
        var commitHash = options.shortHashes ? "%h" : "%H";
        var parentHash = options.shortHashes ? "%p" : "%P";

        //console.log('Processing ' + file);
        // Because all identifiers need to be QNames in PROV, and we need valid turtle as well, we need to get rid of the slashes and dots
        var currentEntity = file.replace(/[\/.]/g, "-");
        provObject.entities[urlprefix + ":file-" + currentEntity] = {"prov:label": file};
        // Next, do a git log for each file to find out about all commits, authors, the commit parents, and the modification type
        // This will output the following: Commit hash, Parent hash(es), Author name, Author date, Committer name, Committer date, Subject, name-status
        // This translates to: activity (commit), derivations, agent (author), starttime, agent (committer), endtime, prov:label (Commit message)
        return 'git --no-pager log --date=iso --name-status --pretty=format:"' + currentEntity + ',' + commitHash + ',' + parentHash + ',%an,%ad,%cn,%cd,%s,&" -- ' + file;
    });
    return logCmds;
}

/* We convert git concepts to PROV concepts as follows:
  
  commit c with subject s ---> activity(c, [prov:label="s"])
  file f   ---> entity(f)
  author a ---> agent(a)
               ---> wasAssociatedWith(c, a, [prov:role="author"])
               ---> wasAttributedTo(f_c, a, [prov:type="authorship"])
  committer ca ---> agent(ca)
               ---> wasAssociatedWith(c, ca, [prov:role="committer"])
  author date ad ---> wasStartedBy(c, -, -, ad)
  commit date cd ---> wasEndedBy(c, -, -, cd)
  file f in commit c ---> specializationOf(f_c, f)
  file f_c added in commit c ---> wasGeneratedBy(f_c, c, authordate)
  file f_c in commit c modified f_c2 from parent commit c2 
    ---> wasGeneratedBy(f_c, c, authordate)
    ---> used(c, f_c2, authordate)
    ---> wasDerivedFrom(f_c, f_c2, c)
    ---> wasInformedBy(c, c2)
  file f_c deleted in commit c ---> wasInvalidatedBy(f_c, c, authordate)
*/

function convertRepositoryToProv(repositoryPath, serialization, requestUrl, options, callback) {
  // set the corresponding variables according to the options
  var ignore = options.ignore ? options.ignore : [];
  // determine a QName for the bundle
  var urlprefix = "result";

  var prefixes = getPrefixes(urlprefix, requestUrl, serialization);

  // We store these assertions in the PROV-JSON format, so they need to be objects.
  // PROV-JSON spec: http://www.w3.org/Submission/prov-json/
  var provObject = getProvObject(prefixes, urlprefix);

   // first, do a git log to find out about all files that ever existed in the repository
   exec('git --no-pager log --pretty=format: --name-only --diff-filter=A', { cwd : repositoryPath }, function (error, stdout) {
    // Keep track of how many files have been processed
    var logCmds = getLogCmds(provObject, stdout, urlprefix, options);

    executeLogCmd(logCmds.pop());
    function executeLogCmd(logcmd) {
      exec( logcmd, { cwd : repositoryPath }, function (error, stdout) {
        var output = stdout.toString().replace(/&\n/g,'');
        var lines = output.split('\n');
        // For some reason, git log appends empty lines here and there. Let's fitler them out.
        lines = lines.filter(function(element) { return element !== ""; });
        lines.forEach(function(line){
                        updateProvObj(provObject, urlprefix, getCommitObj(line)); });
        if (logCmds.length) {
            executeLogCmd(logCmds.pop());
        }
        else {
            serialize(serialization, provObject, ignore, callback);
        }
      });
    }
  });
}

exports.convert = convert;
exports.getProvObject = getProvObject;
exports.getCommitObj = getCommitObj;
exports.updateProvObj = updateProvObj;
exports.getPrefixes = getPrefixes;
exports.getLogCommands = getLogCmds;