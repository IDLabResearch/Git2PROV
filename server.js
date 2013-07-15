/* The HTTP server module */
var express = require("express");

function start(port, route, handle) {
  function onRequest(request, response, next) {
    route(handle, request, response, next);
  }
  
  express()
    .use(express.cookieParser())
    .use(express.session({secret: 'everything to prov'}))
    .use(onRequest)
    .use(express.static('public_html'))
    .listen(port);
    
  console.log("Server has started.");
}

exports.start = start;