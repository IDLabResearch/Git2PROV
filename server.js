/* The HTTP server module */
var express = require("express");
var httpProxy = require("http-proxy");
var options = {
  router: {
    'localhost': '127.0.0.1:8905'
  }
};
function start(port, route, handle) {
  function onRequest(request, response, next) {
    route(handle, request, response, next);
  }
  
  express()
    .use(express.cookieParser())
    .use(express.session({secret: 'everything to prov'}))
    .use(onRequest)
    .use(express.static('public_html'))
    .listen(8905);
    
  var proxyServer = httpProxy.createServer(options);
proxyServer.listen(port);
  console.log("Server has started.");
}

exports.start = start;