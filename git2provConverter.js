/* A converter for a git url to PROV-N */
var sys = require('sys')
var exec = require('child_process').exec;
var serialize = require('./provSerializer').serialize;

function convert(giturl, serialization, callback) {
  // get the repository name. 
  var repository = giturl.substring(giturl.lastIndexOf('/')+1, giturl.lastIndexOf('.git'));
  // This will be used to temporarily store the cloned repository. 
  // TODO: make this different for every user to avoid conflicts, e.g. using a session id.
  var repositoryPath = repository + "12345";
  // clone the git repository
  clone(giturl, repositoryPath, function(error) {
    if (error !== null){
      callback(null, error);
      // cleanup - delete the repository
      exec("rm -rf " + repositoryPath);
    } else {
      // convert the information from the git url to PROV
      convertRepositoryToProv(giturl, repository, repositoryPath, serialization, function(prov,contentType){
        callback(prov,null,contentType);
        // cleanup - delete the repository
        exec("rm -rf " + repositoryPath);
      });
    }
  });
}

function clone(giturl, repositoryPath, callback) {
  exec('git clone '+ giturl + ' ' + repositoryPath, { timeout : 5000 },function (error, stdout, stderr) {
    if( error !== null ) { 
      callback(error);
    } else {
      callback(null);
    }
  });
}

/* We convert git concepts to PROV concepts as follows:
  commit c ---> activity(c)
  file f   ---> entity(f)
  author a ---> agent(a)
  file f in commit c ---> specializationOf(f_c, f)
*/
function convertRepositoryToProv(giturl, repository, repositoryPath, serialization, callback) {
  // determine a QName for the bundle
  var prefix = giturl.substring(giturl.indexOf("://")+3,giturl.indexOf('.'));
  var prefixUrl = giturl.substring(0,giturl.lastIndexOf('/')+1);
  
  // first, do a git log to find out about all files that ever existed in the repository
  exec('git --no-pager log --pretty=format: --name-only --diff-filter=A', { cwd : repositoryPath }, function (error, stdout, stderr) {
    var files = stdout.toString().split('\n');
    // For some reason, git log appends empty lines here and there. Let's fitler them out.
    files = files.filter(function(element, index, array) { return element !== ""; });
    // We store these assertions in the PROV-JSON format, so they need to be objects. PROV-JSON spec: http://www.w3.org/Submission/prov-json/
    var entities = {};
    var activities = {};
    var agents = {};
    var specializations = {};
    var derivations = {};
    var starts = {};
    var ends = {};
    var attributions = {};
    var associations = {};
    // Keep track of how many files have been processed
    var async_count = files.length;
    files.forEach(function(file) {
      // Because all identifiers need to be QNames in PROV, we need to get rid of the slashes
      var currentEntity = file.replace(/\//g,"-");
      entities[currentEntity] = {};
      // Next, do a git log for each file to find out about all commits, authors, and the commit parents
      // This will output the following: Commit hash, Parent hash(es), Author name, Author date, Committer name, Committer date, Subject
      // This translates to: activity (commit), derivations, agent (author), starttime, agent (committer), endtime, prov:label (Commit message)
      exec('git --no-pager log --pretty=format:"'+currentEntity+',%H,%P,%an,%ad,%cn,%cd,%s" -- ' + file, { cwd : repositoryPath }, function (error, stdout, stderr) {
        var lines = stdout.toString().split('\n');
        lines.forEach(function(line){
          var data = line.split(",");
          var entity = data[0];
          var commit = data[1];
          var parents = data[2].split(" ");
          var authorname = data[3];
          var authordate = data[4];
          var committername = data[5];
          var committerdate = data[6];
          var subject = data[7];
          // Add the commit activity to the activities object
          activities[commit] = {"prov:label" : subject};// No need to add the parents as well, since we will eventually loop over them anyway
          starts[commit+"_start"] ={"prov:activity" : commit, "prov:time" : authordate};
          ends[commit+"_end"] = {"prov:activity" : commit, "prov:time" : committerdate};
          // Add the commit entities (files) to the entities, specializations and derivations object
          entities[entity + "_" + commit] = {};
          specializations[entity + "_" + commit + "_specialization"] = {"prov:generalEntity" : entity, "prov:specificEntity" : entity + "_" + commit};
          parents.forEach(function(parent){
            derivations[entity + "_" + commit + "_" + parent] = {
              "prov:activity": commit,
              "prov:generatedEntity": entity + "_" + commit,
              "prov:usedEntity": entity + "_" + parent
            };
          });
          // Add the agents to the stack of agents
          agents[authorname] = {};
          // The file is definitly attributed to the author
          attributions[entity + "_" + commit + "_" + authorname] = {
            "prov:entity" : entity + "_" + commit,
            "prov:agent" : authorname,
            "prov:type" : "authorship"
          }
          // And he/she is definitely associated with the commit activity
          associations[commit + "_" + authorname] = {
            "prov:activity" : commit,
            "prov:agent" : authorname,
            "prov:role" : "author",
          }
          agents[committername] = {};
          // We can't say that the file was attributed to the committer, but we can associate the commit activity with him/her
          if(associations[commit + "_" + committername]){
            associations[commit + "_" + committername]["prov:role"] += ", committer"
          } else {
            associations[commit + "_" + committername] = {
              "prov:activity" : commit,
              "prov:agent" : committername,
              "prov:role" : "committer",
            }
          }
        });
        async_count--;
        if(async_count == 0){
          // Node.js is single-threaded, so don't worry, this always works
          //console.log("all files processed");
          serialize(serialization, prefix, prefixUrl, repository, entities, activities, agents, specializations, derivations, starts, ends, attributions, associations, callback)
        }
      });
    });
  });
}

exports.convert = convert;