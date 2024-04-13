// a socket server for emitting and receiving voices 

const { Server } = require("socket.io");
const http = require("http");

const httpServer = http.createServer();

const io = new Server(httpServer, {
  // your options here
  cors: {
    origin: "*",
  },
});

const rooms = {};

io.on("connection", (socket) => {
  socket.on("isSpeaking", ({roomId, username}) => {
    console.log("isSpeaking", roomId, username);
    // emit to all clients in the room
    if (!rooms[roomId]) {
      console.log('no room');
      return;
    }
    if (!rooms[roomId][username]) {
      return;
    }
    rooms[roomId][username].isSpeaking = true;
    console.log('sending getMembers');
    io.to(roomId).emit("getMembers", rooms[roomId]);
  });

  socket.on("notSpeaking", ({roomId, username}) => {
    // emit to all clients in the room
    if (!rooms[roomId]) {
      return;
    }
    if (!rooms[roomId][username]) {
      return;
    }
    rooms[roomId][username].isSpeaking = false;
    io.to(roomId).emit("getMembers", rooms[roomId]);
  });

  socket.on("joinRoom", ({roomId, username}) => {
    socket.join(roomId);
    if (!rooms[roomId]) {
      rooms[roomId] = {};
    }
    rooms[roomId][username] = {isSpeaking: false};
    // emit to all clients in the room
    io.to(roomId).emit("joinedRoom", username);
    console.log(`${username} joined room ${JSON.stringify(roomId)}`);
  });

  socket.on("getMembers", (roomId) => {
    io.to(roomId).emit("getMembers", rooms[roomId]);
  });

  socket.on("audio", ({roomId, username, audio}) => {
    // emit to all clients in the room
    console.log(roomId, username, audio.length);
    console.log('send audio', audio.length);
    io.to(roomId).emit("audio", {username, audio});
  });

  socket.on("leftRoom", ({roomId, username}) => {
    // delete the user from the room
    delete rooms[roomId][username];
    io.to(roomId).emit("getMembers", rooms[roomId]);
  });

});

const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => console.log(`Socket.io server running on port ${PORT}`));
