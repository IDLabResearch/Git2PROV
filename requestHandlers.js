/* This module contains the handlers for the incoming requests */
var url = require("url");
var git2provConverter = require("./git2provConverter");

function git2prov(request, response) {
  var query = url.parse(request.url, true).query;
  //console.log(query);
  if(query['giturl']){
    var repositoryPath = "temp/repositories/" + request.sessionID;
    git2provConverter.convert(query['giturl'], query['serialization'], repositoryPath, function(prov, error, contentType) {
    //console.log("prov: " + prov + " error: " + error);
      if (error !== null){
        response.writeHead(400, "Git repository could not be cloned.");//for convenience and in-browser viewing, this is text/plain. TODO: make text/provenance-notation
        response.write(error);
        response.end();
      } else {
        response.writeHead(200, {"Content-Type": contentType});//for convenience and in-browser viewing, this is text/plain. TODO: make text/provenance-notation
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