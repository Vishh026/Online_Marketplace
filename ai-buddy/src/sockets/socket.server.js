const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const agent = require("../agents/agent");
const { HumanMessage } = require("@langchain/core/messages");

async function initSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  // 🔐 Auth middleware
  io.use((socket, next) => {
    const cookies = socket.handshake.headers.cookie;
    const { token } = cookies ? cookie.parse(cookies) : {};

    if (!token) return next(new Error("Token missing"));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      socket.token = token;
      next();
    } catch (err) {
      next(err);
    }
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.user?._id);

    socket.on("message", async (text) => {
  console.log("Received from frontend:", text);
      try {
        const result = await agent.invoke(
          {
            messages: [new HumanMessage({ content: text })],
          },
          {
            metadata: { token: socket.token },
          }
        );

        const last =
          result.messages[result.messages.length - 1];

        socket.emit("message", last.content);
      } catch (err) {
        console.error("Agent error:", err.message);
        socket.emit(
          "message",
          "Something went wrong. Please try again."
        );
      }
    });
  });
}

module.exports = { initSocketServer };