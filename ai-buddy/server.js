require("dotenv").config();

const app = require("./src/app");
const http = require("http");
const {initSocketServer} = require("./src/sockets/socket.server")

const httpServer = http.createServer(app);
initSocketServer(httpServer);

httpServer.listen(3006, () => {
  console.log("Socket server running on port 3006");
});
