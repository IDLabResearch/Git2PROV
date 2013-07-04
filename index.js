/* The main module, use "node index.js" to start the server */
var server = require("./server");
var router = require("./router");
var requestHandlers = require("./requestHandlers");

var handle = {};
handle["/git2prov"] = requestHandlers.git2prov;

server.start(8888, router.route, handle);