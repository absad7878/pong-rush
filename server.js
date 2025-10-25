const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

let waitingPlayer = null;

// --- Socket.IO logic ---
io.on("connection", (socket) => {
  console.log("✅ Player connected:", socket.id);

  // Player clicks "Find Opponent"
  socket.on("findMatch", () => {
    console.log(`${socket.id} is looking for an opponent...`);

    if (waitingPlayer) {
      // Pair current socket with the waiting player
      const roomId = `room-${waitingPlayer.id}-${socket.id}`;
      socket.join(roomId);
      waitingPlayer.join(roomId);

      console.log(`🎮 Match created: ${roomId}`);

      // Notify both players that a match has been found
      io.to(waitingPlayer.id).emit("matchFound", { roomId });
      io.to(socket.id).emit("matchFound", { roomId });

      // Reset waiting player
      waitingPlayer = null;
    } else {
      // Store this player as waiting
      waitingPlayer = socket;
      console.log(`${socket.id} is waiting for opponent...`);
    }
  });

  // Player joins the room (from game.html)
  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`✅ ${socket.id} joined ${roomId}`);

    // If both players are in, start the game
    const room = io.sockets.adapter.rooms.get(roomId);
    if (room && room.size === 2) {
      io.to(roomId).emit("startGame");
      console.log(`🚀 Game starting in ${roomId}`);
    }
  });

  // ✅ NEW — Listen for paddle movement and share with the opponent
  socket.on("playerMove", ({ roomId, x }) => {
    socket.to(roomId).emit("opponentMove", x);
  });

  // Handle player disconnect
  socket.on("disconnect", () => {
    console.log("❌ Player disconnected:", socket.id);
    if (waitingPlayer && waitingPlayer.id === socket.id) {
      waitingPlayer = null;
    }
  });
});

// --- Start the server ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
