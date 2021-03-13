/* The HTTP server module */
var express = require('express'),
    path = require('path');
const PORT = process.env.PORT || 8905;
function start(route, handle) {
  function onRequest(request, response, next) {
    route(handle, request, response, next);
  }

  express()
    .use(express.cookieParser())
    .use(express.session({secret: 'everything to prov'}))
    .use(onRequest)
    .use(express.static(path.join(__dirname, '../public_html')))
    .listen(PORT);
}

exports.start = start;
