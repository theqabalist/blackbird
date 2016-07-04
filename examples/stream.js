/* jshint -W058 */
// This example demonstrates how mach can be used to create a server
// that streams content back to the client. The best way to see the
// streaming data is probably using curl or netcat, e.g.
// curl http://localhost:5000

let Stream = require("bufferedstream");
let mach = require("../modules");

mach.serve(function (conn) {
  // Set conn.response.content to the stream you want to send.
  // In this example, the stream is an infinite stream of
  // timestamps. Typically you'd use one of node's readables
  // (e.g. fs.createReadStream).
    let content = conn.response.content = new Stream;

    let timer = setInterval(function () {
        content.write(`${new Date}\n`);
    }, 1000);

    conn.onClose = function () {
        console.log("client closed connection");
        clearInterval(timer);
    };
});
