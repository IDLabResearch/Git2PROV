/* This module contains the handlers for the incoming requests */
var url = require("url");
var git2provConverter = require("./git2provConverter");

function git2prov(request, response) {
  var query = url.parse(request.url, true).query;
  //console.log(query);
  if(query['giturl']){
    git2provConverter.convert(query['giturl'], function(prov, error) {
    //console.log("prov: " + prov + " error: " + error);
      if (error !== null){
        response.writeHead(400, "Git repository could not be cloned.");//for convenience and in-browser viewing, this is text/plain. TODO: make text/provenance-notation
        response.end();
      } else {
        response.writeHead(200, {"Content-Type": "text/plain"});//for convenience and in-browser viewing, this is text/plain. TODO: make text/provenance-notation
        response.write(prov);
        response.end();
      }
    });
  }else{
    response.writeHead(400, "Missing one or more required parameters.");
    response.end();
  }
}

exports.git2prov = git2prov;