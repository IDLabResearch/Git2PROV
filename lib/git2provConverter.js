/* A converter for a git url to PROV-N */
var sys = require('sys');
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
  exec('git clone '+ giturl + ' ' + repositoryPath, { timeout : 30000 },function (error, stdout, stderr) {
    if( error !== null ) { 
      callback(error);
    } else {
      callback(null);
    }
  });
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
  var commitHash = options['shortHashes']?"%h":"%H";
  var parentHash = options['shortHashes']?"%p":"%P";
  var ignore = options['ignore']?options['ignore']:[];
  // determine a QName for the bundle
  var prefixes = {};
  var urlprefix = "result";
  prefixes[urlprefix] = requestUrl + "#";
  prefixes["fullResult"] = requestUrl.substring(0,requestUrl.indexOf('&')) + "&serialization=" + serialization + "#";
  
  // first, do a git log to find out about all files that ever existed in the repository
  exec('git --no-pager log --pretty=format: --name-only --diff-filter=A', { cwd : repositoryPath }, function (error, stdout, stderr) {
    var files = stdout.toString().split('\n');
    // For some reason, git log appends empty lines here and there. Let's fitler them out.
    files = files.filter(function(element, index, array) { return element !== ""; });
    // We store these assertions in the PROV-JSON format, so they need to be objects. PROV-JSON spec: http://www.w3.org/Submission/prov-json/
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
    // Keep track of how many files have been processed
    var async_count = files.length;
    var logCmds = files.map(function(file) {
      //console.log('Processing ' + file);
      // Because all identifiers need to be QNames in PROV, and we need valid turtle as well, we need to get rid of the slashes and dots
      var currentEntity = file.replace(/[\/.]/g,"-");
      provObject.entities[urlprefix + ":file-" + currentEntity] = {"prov:label" : file};
      // Next, do a git log for each file to find out about all commits, authors, the commit parents, and the modification type
      // This will output the following: Commit hash, Parent hash(es), Author name, Author date, Committer name, Committer date, Subject, name-status
      // This translates to: activity (commit), derivations, agent (author), starttime, agent (committer), endtime, prov:label (Commit message)
        return 'git --no-pager log --date=iso --name-status --pretty=format:"'+currentEntity+','+commitHash+','+parentHash+',%an,%ad,%cn,%cd,%s,&" -- ' + file ;
    });
    executeLogCmd(logCmds.pop());
    function executeLogCmd(logcmd) {
      exec( logcmd, { cwd : repositoryPath }, function (error, stdout, stderr) {
        var output = stdout.toString().replace(/&\n/g,'');
        var lines = output.split('\n');
        // For some reason, git log appends empty lines here and there. Let's fitler them out.
        lines = lines.filter(function(element, index, array) { return element !== ""; });
        lines.forEach(function(line){
          // remove the trailing filename from the --name-status line 
          line = line.substring(0,line.lastIndexOf(',')+2);
          var data = line.split(",");
          var entity = "file-" + data[0];
          var commit = "commit-" + data[1];
          var commitEntity = entity + "_" + commit;
          var parents = data[2]?data[2].split(" "):[];
          var authorname = "user-" + data[3].replace(/ /g,"-");
          var authorlabel = data[3];
          var authordate = new Date(data[4]).toISOString();
          var committername = "user-" + data[5].replace(/ /g,"-");
          var committerlabel = data[5];
          var committerdate = new Date(data[6]).toISOString();
          var subject = data[7];
          var modificationType = data[8];
          // Add the commit activity to the activities object
          provObject.activities[urlprefix + ":" + commit] = {"prov:label" : subject};// No need to add the parents as well, since we will eventually loop over them anyway
          provObject.starts[urlprefix + ":" + commit+"_start"] ={"prov:activity" : urlprefix + ":" + commit, "prov:time" : authordate};
          provObject.ends[urlprefix + ":" + commit+"_end"] = {"prov:activity" : urlprefix + ":" + commit, "prov:time" : committerdate};
          // Add the commit entities (files) to the entities, specializations and derivations object
          provObject.entities[urlprefix + ":" + commitEntity] = {};
          provObject.specializations[urlprefix + ":" + commitEntity + "_spec"] = {"prov:generalEntity" : urlprefix + ":" + entity, "prov:specificEntity" : urlprefix + ":" + commitEntity};
          switch(modificationType){
            case "D":
            // The file was deleted in this commit  
              provObject.invalidations[urlprefix + ":" + commitEntity + "_inv"] = {
                "prov:entity": urlprefix + ":" + commitEntity,
                "prov:activity": urlprefix + ":" + commit,
                "prov:time": authordate
              };
              break;
            case "A":
            // The file was added in this commit  
              provObject.generations[urlprefix + ":" + commitEntity + "_gen"] = {
                "prov:entity": urlprefix + ":" + commitEntity,
                "prov:activity": urlprefix + ":" + commit,
                "prov:time": authordate
              };
              break;
            default:
            // The file was modified in this commit
              var generation = urlprefix + ":" + commitEntity + "_gen";
              provObject.generations[generation] = {
                "prov:activity": urlprefix + ":" + commit,
                "prov:entity": urlprefix + ":" + commitEntity,
                "prov:time": authordate
              };
              parents.forEach(function(parent){
                if(parent !== ""){
                  var parentEntity = entity + "_commit-" + parent;
                  var usage = urlprefix + ":" + parentEntity + "_" + commit + "_use";
                  provObject.usages[usage] = {
                    "prov:activity": urlprefix + ":" + commit,
                    "prov:entity": urlprefix + ":" + parentEntity,
                    "prov:time": authordate
                  };
                  provObject.derivations[urlprefix + ":" + commitEntity + "_" + parent + "_der"] = {
                    "prov:activity": urlprefix + ":" + commit,
                    "prov:generatedEntity": urlprefix + ":" + commitEntity,
                    "prov:usedEntity": urlprefix + ":" + parentEntity,
                    "prov:generation": generation,
                    "prov:usage": usage
                  };
                  provObject.communications[urlprefix + ":" + commit + "_" + parent + "_comm"] = {
                    "prov:informant": urlprefix + ":" + "commit-" + parent,
                    "prov:informed": urlprefix + ":" + commit
                  };
                }
              });
              break;
          }
          // Add the agents to the stack of agents
          provObject.agents[urlprefix + ":" + authorname] = {"prov:label" : authorlabel};
          // The file is definitly attributed to the author
          provObject.attributions[urlprefix + ":" + entity + "_" + commit + "_" + authorname + "_attr"] = {
            "prov:entity" : urlprefix + ":" + commitEntity,
            "prov:agent" : urlprefix + ":" + authorname,
            "prov:type" : "authorship"
          };
          // And he/she is definitely associated with the commit activity
          provObject.associations[urlprefix + ":" + commit + "_" + authorname + "_assoc"] = {
            "prov:activity" : urlprefix + ":" + commit,
            "prov:agent" : urlprefix + ":" + authorname,
            "prov:role" : "author"
          };
          provObject.agents[urlprefix + ":" + committername] = {"prov:label" : committerlabel};
          // We can't say that the file was attributed to the committer, but we can associate the commit activity with him/her
          if(provObject.associations[urlprefix + ":" + commit + "_" + committername + "_assoc"]){
            provObject.associations[urlprefix + ":" + commit + "_" + committername + "_assoc"]["prov:role"] += ", committer";
          } else {
            provObject.associations[urlprefix + ":" + commit + "_" + committername + "_assoc"] = {
              "prov:activity" : urlprefix + ":" + commit,
              "prov:agent" : urlprefix + ":" + committername,
              "prov:role" : "committer"
            };
          }
        });
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
