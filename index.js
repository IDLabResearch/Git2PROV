/* The main module, use "node index.js" to start the server */
var server = require("./server");
var router = require("./router");
var requestHandlers = require("./requestHandlers");

var handle = {};
handle["/git2prov"] = requestHandlers.git2prov;

if(process.argv[2])
  server.start(parseInt(process.argv[2]), router.route, handle);
else
  console.log("Please specify a port number");