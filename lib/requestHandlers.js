/* This module contains the handlers for the incoming requests */
var url = require("url");
var fs = require('fs');
var os = require('os');
var path = require('path');
var git2provConverter = require("./git2provConverter");

function git2prov(request, response) {
  var query = url.parse(request.url, true).query;
  var options = {};
  if(query['ignore']) {
      options['ignore'] = query['ignore'];
  }
  if(query['shortHashes']) {
      options['shortHashes'] = query['shortHashes'];
  }
  if(query['giturl']){
    var tempPath = path.join(os.tmpdir(), 'git2provserver');
    //Windows workaround to overcome permission issues with the C:\Users\{user}\AppData\Local\Temp\ folder. 
    //If the folder C:\Users\{user}\AppData\Local\Temp\git2provserver doesn't exist yet, every request hangs at the clone stage.
    if(!fs.existsSync(tempPath)){
      fs.mkdirSync(tempPath);
    }
    var repositoryPath =  path.join(tempPath, request.sessionID);
    git2provConverter.convert(query['giturl'], query['serialization'], repositoryPath, 
      "http://" + request.headers.host + request.url, options, function(prov, error, contentType) {
    //console.log("prov: " + prov + " error: " + error);
      if (error !== null){
        response.writeHead(400, "Git repository could not be cloned." + error);
        response.end();
      } else {
        response.writeHead(200, {"Content-Type": contentType});
        response.write(prov);
        response.end();
      }
      request.session.destroy();
    });
  }else{
    response.writeHead(400, "Missing one or more required parameters.");
    response.end();
  }
}

exports.git2prov = git2prov;
