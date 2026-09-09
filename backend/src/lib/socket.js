import { Server } from "socket.io";
import http from "http";
import express from "express";
import User from "../models/user.model.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://nexchatapp-tau.vercel.app"],
    credentials: true,
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

const userSocketMap = {};

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;
    io.emit("userStatusChanged", {
      userId,
      isOnline: true,
      lastSeen: new Date(),
    });
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", async () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    if (userId) {
      try {
        const now = new Date();
        const updatedUser = await User.findByIdAndUpdate(
          userId,
          { lastSeen: now },
          { new: true }
        ).select("-password");

        if (updatedUser) {
          io.emit("userStatusChanged", {
            userId,
            isOnline: false,
            lastSeen: updatedUser.lastSeen,
            showOnlineStatus: updatedUser.showOnlineStatus !== false,
          });
        }
      } catch (err) {
        console.error("Error updating lastSeen on disconnect:", err);
      }
    }
  });

  socket.on("typing", ({ to, from }) => {
    const receiverSocketId = userSocketMap[to];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("typing", { from });
    }
  });

  socket.on("stopTyping", ({ to, from }) => {
    const receiverSocketId = userSocketMap[to];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("stopTyping", { from });
    }
  });
});

export { io, app, server };
