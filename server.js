/* The HTTP server module */
var http = require("http");

function start(port, route, handle) {
  function onRequest(request, response) {
    route(handle, request, response);
  }
  
  http.createServer(onRequest).listen(port);
  console.log("Server has started.");
}

exports.start = start;