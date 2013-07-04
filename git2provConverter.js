/* A converter for a git url to PROV-N */
var sys = require('sys')
var exec = require('child_process').exec;

function convert(giturl, callback) {
  //clone the git repository
  clone(giturl, function(error) {
    var repository = giturl.substring(giturl.lastIndexOf('/')+1, giturl.lastIndexOf('.git'));
    if (error !== null){
      callback(null, error);
    } else {
      //convert the information from the git url to PROV
      var prov = "document" + "\n";
      //determine a QName for the bundle
      var prefix = giturl.substring(giturl.indexOf("://")+3,giturl.indexOf('.'));
      var prefixurl = giturl.substring(0,giturl.lastIndexOf('/')+1);
      prov += "prefix " + prefix + " <" + prefixurl + ">" + "\n";
      prov += "bundle " + prefix + ":" + repository + "\n";
      prov += "endBundle " + "\n";
      prov += "endDocument" + "\n";
      callback(prov,null);
    }
    //delete the repository
    exec("rm -rf " + repository);
  });
}

function clone(giturl, callback) {
  exec('git clone '+ giturl, { timeout : 5000 },function (error, stdout, stderr) {
    if( error !== null ) { 
      callback(error);
    } else {
      callback(null);
    }
  });
}

exports.convert = convert;