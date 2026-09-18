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
  pingTimeout: 30000,
  pingInterval: 25000,
});

// Map of userId -> Set of socket IDs
const userSocketMap = {};

export function isUserOnline(userId) {
  if (!userId) return false;
  const uid = userId.toString();
  return Boolean(userSocketMap[uid] && userSocketMap[uid].size > 0);
}

export function getReceiverSocketId(userId) {
  if (!userId) return null;
  const uid = userId.toString();
  const sockets = userSocketMap[uid];
  return sockets && sockets.size > 0 ? Array.from(sockets)[0] : null;
}

export function getUserSocketIds(userId) {
  if (!userId) return [];
  const uid = userId.toString();
  return userSocketMap[uid] ? Array.from(userSocketMap[uid]) : [];
}

io.on("connection", (socket) => {
  const rawUserId = socket.handshake.query.userId;
  const userId = rawUserId ? rawUserId.toString() : null;

  console.log(`Socket connected: ${socket.id} (User: ${userId || "Guest"})`);

  if (userId) {
    if (!userSocketMap[userId]) {
      userSocketMap[userId] = new Set();
    }
    userSocketMap[userId].add(socket.id);

    // Join dedicated user room for reliable broadcast to all user devices/tabs
    socket.join(userId);

    // If this is the user's first active connection, broadcast online status
    if (userSocketMap[userId].size === 1) {
      io.emit("userStatusChanged", {
        userId,
        isOnline: true,
        lastSeen: new Date(),
      });
    }
  }

  // Broadcast list of currently online user IDs
  io.emit(
    "getOnlineUsers",
    Object.keys(userSocketMap).filter(
      (uid) => userSocketMap[uid] && userSocketMap[uid].size > 0
    )
  );

  socket.on("disconnect", async () => {
    console.log(`Socket disconnected: ${socket.id} (User: ${userId || "Guest"})`);

    if (userId && userSocketMap[userId]) {
      userSocketMap[userId].delete(socket.id);

      // Only mark as offline when the user has NO remaining active sockets
      if (userSocketMap[userId].size === 0) {
        delete userSocketMap[userId];

        io.emit(
          "getOnlineUsers",
          Object.keys(userSocketMap).filter(
            (uid) => userSocketMap[uid] && userSocketMap[uid].size > 0
          )
        );

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
    }
  });

  socket.on("typing", ({ to, from }) => {
    if (to) {
      io.to(to.toString()).emit("typing", { from });
    }
  });

  socket.on("stopTyping", ({ to, from }) => {
    if (to) {
      io.to(to.toString()).emit("stopTyping", { from });
    }
  });
});

export { io, app, server, userSocketMap };

