/* A converter for a git url to PROV-N */
var sys = require('sys')
var exec = require('child_process').exec;

function convert(giturl, callback) {
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
      convertRepositoryToProv(giturl, repository, repositoryPath, function(prov){
        callback(prov,null);
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

function convertRepositoryToProv(giturl, repository, repositoryPath, callback) {
  // determine a QName for the bundle
  var prefix = giturl.substring(giturl.indexOf("://")+3,giturl.indexOf('.'));
  var prefixurl = giturl.substring(0,giturl.lastIndexOf('/')+1);
  
  //do a git log
  exec('git --no-pager log --graph --pretty=format:",%H,%an"', { cwd : repositoryPath }, function (error, stdout, stderr) {
    
    console.log(stdout);
    
    //write everything to the result string
    var prov = "document" + "\n";
    prov += "prefix " + prefix + " <" + prefixurl + ">" + "\n";
    prov += "bundle " + prefix + ":" + repository + "\n";
    prov += "endBundle " + "\n";
    prov += "endDocument" + "\n";
    
    callback(prov,null);
  });
}

exports.convert = convert;