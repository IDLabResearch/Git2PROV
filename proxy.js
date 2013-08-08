/* The proxy server, to run as root on port 80 */
var http = require('http'),
    httpProxy = require('http-proxy');
/* Default: 80 */
var proxyPort = 80;
/* Default: 8905 */
var port = 8905; 
if(process.argv[2]){
  proxyPort = parseInt(process.argv[2]);
}
if(process.argv[3]){
  port = parseInt(process.argv[3]);
}
console.log("Redirecting port " + proxyPort + " to port " + port + ".");

httpProxy.createServer(port, 'localhost').listen(proxyPort);