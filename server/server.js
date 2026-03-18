//initialize server, variables & libs
//Allow Cors
const http = require("http");
const {Server} = require("socket.io");
const setupSockets = require("./sockets");
const server = http.createServer();
const { instrument } = require("@socket.io/admin-ui");





//Server setup
const io = new Server(server, {
  cors: {
    origin: ["http://127.0.0.1:5500", "http://10.144.15.17:5500", "https://admin.socket.io"],
  }
});

//socket admin ui
instrument(io, {
  auth: false,
  mode: "development",
});

//Start Server
server.listen(3000, () => {
  console.log("Socket server running on port 3000");
});
//Error handle
server.on("error", (err) => {
  console.error("Server failed to start:", err);
});

//Socket Handing  
setupSockets(io);

