/* The HTTP server module */
var connect = require("connect");

function start(port, route, handle) {
  function onRequest(request, response) {
    route(handle, request, response);
  }
  
  connect()
    .use(connect.cookieParser())
    .use(connect.session({secret: 'everything to prov'}))
    .use(onRequest).listen(port);
    
  console.log("Server has started.");
}

exports.start = start;