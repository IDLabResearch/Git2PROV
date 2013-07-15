/* This module routes the incoming requests to the correct handler */
var url = require("url");

function route(handle, request, response, next) {
  var pathname = url.parse(request.url).pathname;
  //console.log("Request for " + pathname + " received.");
  if (typeof handle[pathname] === "function") {
      return handle[pathname](request, response);
  } else {
      next();
  }
}

exports.route = route;