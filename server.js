const { Server } = require("socket.io");
const http = require("http");

const httpServer = http.createServer();
let strokes = {
  
}
const io = new Server(httpServer, {
  // your options here
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log(`New connection: ${socket.id}`);

  // join a specific room
  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    if (!strokes[roomId]) {
      strokes[roomId] = [];
    }
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  // forwarding messages to a room
  socket.on("sendMessage", ({ roomId, message }) => {
    io.to(roomId).emit("newMessage", message);
  });

  socket.on("getStrokes", (roomId) => {
    io.to(roomId).emit("getStrokens", strokes[roomId]);
  });

  socket.on("drawing", ({ roomId, data }) => {
    if (!strokes[roomId]) {
      strokes[roomId] = [];
    }
    strokes[roomId].push(data);
    io.to(roomId).emit("drawing", strokes[roomId]);
  });

  socket.on('resetCanvas', (roomId) => {
    console.log('resetCanvas', roomId);
    io.to(roomId).emit('drawing', strokes);
  });

});

const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => console.log(`Socket.io server running on port ${PORT}`));
