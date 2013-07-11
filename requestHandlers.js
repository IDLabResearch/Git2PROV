/* This module contains the handlers for the incoming requests */
var url = require("url");
var fs = require('fs');
var git2provConverter = require("./git2provConverter");

function git2prov(request, response) {
  var query = url.parse(request.url, true).query;
  var options = {};
  if(query['ignore'])
    options['ignore'] = query['ignore'];
  if(query['shortHashes'])
    options['shortHashes'] = query['shortHashes'];
  if(query['giturl']){
    var repositoryPath = "temp/repositories/" + request.sessionID;
    git2provConverter.convert(query['giturl'], query['serialization'], repositoryPath, "http://" + request.headers.host + request.url, options, function(prov, error, contentType) {
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

function webpage(request, response) {
  fs.readFile('./public_html/git2prov/index.html', function (err, data) {
    if (err) {
      response.writeHead(404, "Not found.");
      response.end();
    }else{
      index = data;
      response.writeHead(200, {"Content-Type": "text/html"});
      response.write(index);
      response.end();
    }
  });
}

exports.git2prov = git2prov;
exports.webpage = webpage;