const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server); // No CORS for local testing

app.use(express.static(path.join(__dirname, "public")));

let waitingPlayer = null;

io.on("connection", (socket) => {
  console.log("✅ Player connected:", socket.id);

  socket.on("connect_error", (err) => {
    console.error("Socket connection error:", err.message);
  });

  socket.on("findMatch", () => {
    console.log(`Received findMatch from ${socket.id}`);
    if (waitingPlayer) {
      console.log(`Pairing ${waitingPlayer.id} with ${socket.id}`);
      const roomId = `room-${waitingPlayer.id}-${socket.id}`;
      socket.join(roomId);
      waitingPlayer.join(roomId);
      console.log(`🎮 Match created: ${roomId}, Players: ${Array.from(io.sockets.adapter.rooms.get(roomId))}`);
      io.to(waitingPlayer.id).emit("matchFound", { roomId });
      io.to(socket.id).emit("matchFound", { roomId });
      waitingPlayer = null;
    } else {
      waitingPlayer = socket;
      console.log(`${socket.id} is waiting for opponent...`);
    }
  });

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`✅ ${socket.id} joined ${roomId}, Room size: ${io.sockets.adapter.rooms.get(roomId)?.size || 0}`);
    const room = io.sockets.adapter.rooms.get(roomId);
    if (room && room.size === 2) {
      io.to(roomId).emit("startGame");
      console.log(`🚀 Game starting in ${roomId}, Players: ${Array.from(room)}`);
    } else {
      console.log(`Waiting for more players in ${roomId}, Current size: ${room?.size || 0}`);
    }
  });

  socket.on("playerMove", ({ roomId, x }) => {
    socket.to(roomId).emit("opponentMove", x);
  });

  socket.on("disconnect", () => {
    console.log("❌ Player disconnected:", socket.id);
    if (waitingPlayer && waitingPlayer.id === socket.id) {
      waitingPlayer = null;
      console.log("Cleared waiting player");
    }
    const rooms = io.sockets.adapter.sids.get(socket.id);
    if (rooms) {
      for (const roomId of rooms) {
        if (roomId !== socket.id) {
          socket.to(roomId).emit("opponentDisconnected");
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});