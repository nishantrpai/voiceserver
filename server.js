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
    // emit to all clients in the room
    if (!rooms[roomId]) {
      return;
    }
    if (!rooms[roomId][username]) {
      return;
    }
    rooms[roomId][username].isSpeaking = true;
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
  });

  socket.on("getMembers", (roomId) => {
    io.to(roomId).emit("getMembers", rooms[roomId]);
  });

  socket.on("audio", ({roomId, username, audio}) => {
    // emit to all clients in the room
    io.to(roomId).emit("audio", {username, audio, roomId});
  });

  socket.on("leftRoom", ({roomId, username}) => {
    // delete the user from the room
    delete rooms[roomId][username];
    // if the room is empty, delete the room
    if (Object.keys(rooms[roomId]).length === 0) {
      delete rooms[roomId];
    }
    io.to(roomId).emit("getMembers", rooms[roomId]);
  });

  socket.on("fetchRooms", () => {
    // fetch all rooms and number of members in each
    let rooms = [];
    for (let room in rooms) {
      rooms.push({room, members: rooms[room].length});
    }
    io.to(socket.id).emit("rooms", rooms);
  });

});

const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => console.log(`Socket.io server running on port ${PORT}`));
