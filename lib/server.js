/* The HTTP server module */
var express = require('express'),
    path = require('path');
function start(port, route, handle) {
  function onRequest(request, response, next) {
    route(handle, request, response, next);
  }
  
  express()
    .use(express.cookieParser())
    .use(express.session({secret: 'everything to prov'}))
    .use(onRequest)
    .use(express.static(path.join(__dirname, '../public_html')))
    .listen(port);
}

exports.start = start;
