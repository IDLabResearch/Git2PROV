/* This module routes the incoming requests to the correct handler */
var url = require("url");

function route(handle, request, response) {
  var pathname = url.parse(request.url).pathname;
  //console.log("Request for " + pathname + " received.");
  if (typeof handle[pathname] === "function") {
      return handle[pathname](request, response);
  } else {
      response.writeHead(404, {"Content-Type": "text/html"});
      response.write("404 Not found");
      response.end();
  }
}

exports.route = route;