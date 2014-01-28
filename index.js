/* The main module, use "node index.js" to start the server */
var server = require("./lib/server");
var router = require("./lib/router");
var requestHandlers = require("./lib/requestHandlers");

var handle = {};
handle["/git2prov"] = requestHandlers.git2prov;

if(process.argv[2])
  server.start(parseInt(process.argv[2]), router.route, handle);
else
  server.start(8905, router.route, handle);
