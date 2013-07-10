/* A converter for a git url to PROV-N */
var sys = require('sys')
var exec = require('child_process').exec;
var serialize = require('./provSerializer').serialize;

/* Convert the git repository at giturl to PROV in the specified serialization.
   RepositoryPath will be used to temporarily store the cloned repository on the server. 
*/
function convert(giturl, serialization, repositoryPath, requestUrl, callback) {
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
      convertRepositoryToProv(giturl, repository, repositoryPath, serialization, requestUrl, function(prov,contentType){
        callback(prov,null,contentType);
        // cleanup - delete the repository
        exec("rm -rf " + repositoryPath);
      });
    }
  });
}

/* Clone a git repository (at giturl) to the specified repositoryPath on the server */
function clone(giturl, repositoryPath, callback) {
  exec('git clone '+ giturl + ' ' + repositoryPath, { timeout : 10000 },function (error, stdout, stderr) {
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
  file f in commit c ---> specializationOf(f_c, f)
  file f in commit c and f2 in parent commit c2 ---> wasDerivedFrom(f2_c2, f_c, c)
  author a ---> agent(a)
               ---> wasAssociatedWith(c, a, [prov:role="author"])
               ---> wasAttributedTo(f_c, a, [prov:type="authorship"])
  committer ca ---> agent(ca)
               ---> wasAssociatedWith(c, ca, [prov:role="committer"])
  author date ad ---> wasStartedBy(c, -, -, ad)
  commit date cd ---> wasEndedBy(c, -, -, cd)
*/
function convertRepositoryToProv(giturl, repository, repositoryPath, serialization, requestUrl, callback) {
  // determine a QName for the bundle
  var prefixes = {};
  prefixes["repository"] = giturl.substring(0,giturl.lastIndexOf('/')+1);
  var urlprefix = "result";
  prefixes[urlprefix] = requestUrl + "#";
  
  // first, do a git log to find out about all files that ever existed in the repository
  exec('git --no-pager log --pretty=format: --name-only --diff-filter=A', { cwd : repositoryPath }, function (error, stdout, stderr) {
    var files = stdout.toString().split('\n');
    // For some reason, git log appends empty lines here and there. Let's fitler them out.
    files = files.filter(function(element, index, array) { return element !== ""; });
    // We store these assertions in the PROV-JSON format, so they need to be objects. PROV-JSON spec: http://www.w3.org/Submission/prov-json/
    var provObject = {};
    provObject.entities = {};
    provObject.activities = {};
    provObject.agents = {};
    provObject.specializations = {};
    provObject.derivations = {};
    provObject.starts = {};
    provObject.ends = {};
    provObject.attributions = {};
    provObject.associations = {};
    provObject.generations = {};
    provObject.invalidations = {};
    // Keep track of how many files have been processed
    var async_count = files.length;
    files.forEach(function(file) {
      // Because all identifiers need to be QNames in PROV, we need to get rid of the slashes
      var currentEntity = file.replace(/\//g,"-");
      provObject.entities[urlprefix + ":" + currentEntity] = {};
      // Next, do a git log for each file to find out about all commits, authors, the commit parents, and the modification type
      // This will output the following: Commit hash, Parent hash(es), Author name, Author date, Committer name, Committer date, Subject, name-status
      // This translates to: activity (commit), derivations, agent (author), starttime, agent (committer), endtime, prov:label (Commit message)
      exec('git --no-pager log --name-status --pretty=format:"'+currentEntity+',%H,%P,%an,%ad,%cn,%cd,%s,&" -- ' + file, { cwd : repositoryPath }, function (error, stdout, stderr) {
        var output = stdout.toString().replace(/&\n/g,'');
        var lines = output.split('\n');
        // For some reason, git log appends empty lines here and there. Let's fitler them out.
        lines = lines.filter(function(element, index, array) { return element !== ""; });
        lines.forEach(function(line){
          // remove the trailing filename from the --name-status line 
          line = line.substring(0,line.lastIndexOf(',')+2);
          var data = line.split(",");
          var entity = data[0];
          var commit = data[1];
          var parents = data[2].split(" ");
          var authorname = data[3].replace(/ /g,"-");
          var authorlabel = data[3];
          var authordate = data[4];
          var committername = data[5].replace(/ /g,"-");
          var committerlabel = data[5];
          var committerdate = data[6];
          var subject = data[7];
          var modificationType = data[8];
          // Add the commit activity to the activities object
          provObject.activities[urlprefix + ":" + commit] = {"prov:label" : subject};// No need to add the parents as well, since we will eventually loop over them anyway
          provObject.starts[urlprefix + ":" + commit+"_start"] ={"prov:activity" : urlprefix + ":" + commit, "prov:time" : authordate};
          provObject.ends[urlprefix + ":" + commit+"_end"] = {"prov:activity" : urlprefix + ":" + commit, "prov:time" : committerdate};
          // Add the commit entities (files) to the entities, specializations and derivations object
          provObject.entities[urlprefix + ":" + entity + "_" + commit] = {};
          provObject.specializations[urlprefix + ":" + entity + "_" + commit + "_specialization"] = {"prov:generalEntity" : urlprefix + ":" + entity, "prov:specificEntity" : urlprefix + ":" + entity + "_" + commit};
          switch(modificationType){
            case "D":
            // The file was deleted in this commit  
              provObject.invalidations[urlprefix + ":" + entity + "_" + commit + "_inv"] = {
                "prov:entity": urlprefix + ":" + entity + "_" + commit,
                "prov:activity": urlprefix + ":" + commit,
                "prov:time": authordate,
              }
            case "A":
            // The file was added in this commit  
              provObject.generations[urlprefix + ":" + entity + "_" + commit + "_gen"] = {
                "prov:entity": urlprefix + ":" + entity + "_" + commit,
                "prov:activity": urlprefix + ":" + commit,
                "prov:time": authordate,
              }
            default:
            // The file was modified in this commit
              parents.forEach(function(parent){
                if(parent !== ""){
                  provObject.derivations[urlprefix + ":" + entity + "_" + commit + "_" + parent] = {
                    "prov:activity": urlprefix + ":" + commit,
                    "prov:generatedEntity": urlprefix + ":" + entity + "_" + commit,
                    "prov:usedEntity": urlprefix + ":" + entity + "_" + parent
                  };
                }
              });
          }
          // Add the agents to the stack of agents
          provObject.agents[urlprefix + ":" + authorname] = {"prov:label" : authorlabel};
          // The file is definitly attributed to the author
          provObject.attributions[urlprefix + ":" + entity + "_" + commit + "_" + authorname] = {
            "prov:entity" : urlprefix + ":" + entity + "_" + commit,
            "prov:agent" : urlprefix + ":" + authorname,
            "prov:type" : "authorship"
          }
          // And he/she is definitely associated with the commit activity
          provObject.associations[urlprefix + ":" + commit + "_" + authorname] = {
            "prov:activity" : urlprefix + ":" + commit,
            "prov:agent" : urlprefix + ":" + authorname,
            "prov:role" : "author",
          }
          provObject.agents[urlprefix + ":" + committername] = {"prov:label" : committerlabel};
          // We can't say that the file was attributed to the committer, but we can associate the commit activity with him/her
          if(provObject.associations[urlprefix + ":" + commit + "_" + committername]){
            provObject.associations[urlprefix + ":" + commit + "_" + committername]["prov:role"] += ", committer"
          } else {
            provObject.associations[urlprefix + ":" + commit + "_" + committername] = {
              "prov:activity" : urlprefix + ":" + commit,
              "prov:agent" : urlprefix + ":" + committername,
              "prov:role" : "committer",
            }
          }
        });
        async_count--;
        if(async_count == 0){
          // Node.js is single-threaded, so don't worry, this always works
          //console.log("all files processed");
          serialize(serialization, provObject, repository, callback)
        }
      });
    });
  });
}

exports.convert = convert;