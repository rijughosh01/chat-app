import { Server } from "socket.io";
import http from "http";
import express from "express";
import jwt from "jsonwebtoken";
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

// Helper to parse cookies from handshake headers
function parseCookies(cookieHeader) {
  if (!cookieHeader || typeof cookieHeader !== "string") return {};
  return cookieHeader.split(";").reduce((res, c) => {
    const [key, ...val] = c.trim().split("=");
    if (key) {
      try {
        res[key] = decodeURIComponent(val.join("="));
      } catch {
        res[key] = val.join("=");
      }
    }
    return res;
  }, {});
}

// Socket.IO authentication middleware verifying JWT token
io.use((socket, next) => {
  try {
    const cookies = parseCookies(socket.handshake.headers?.cookie);
    const token =
      cookies.jwt ||
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, "");

    if (!token) {
      return next(new Error("Authentication error: No authentication token provided"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.userId) {
      return next(new Error("Authentication error: Invalid or expired token"));
    }

    // Set securely verified userId onto the socket object
    socket.userId = decoded.userId.toString();
    next();
  } catch (err) {
    console.error(`Socket authentication rejected (${socket.id}):`, err.message);
    return next(new Error("Authentication error: Unauthorized"));
  }
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
  // Use securely verified userId from JWT middleware instead of unverified query params
  const userId = socket.userId;

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

    // Clean up any active call if the user unexpectedly closed tab or disconnected
    if (socket.currentCallTarget) {
      io.to(socket.currentCallTarget).emit("call:ended", {
        from: userId,
        reason: "disconnected",
      });
      delete socket.currentCallTarget;
    }

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

  // Real-time Audio / Video Calling Signaling
  socket.on("call:initiate", ({ to, callType, callerName, callerPic }) => {
    if (to && userId) {
      socket.currentCallTarget = to.toString();
      io.to(to.toString()).emit("call:incoming", {
        from: userId,
        callType,
        callerName,
        callerPic,
        callerSocketId: socket.id,
      });
    }
  });

  socket.on("call:accept", ({ to, signal }) => {
    if (to && userId) {
      socket.currentCallTarget = to.toString();
      io.to(to.toString()).emit("call:accepted", {
        from: userId,
        signal,
      });
      // Dismiss incoming ringing on caller's / callee's other tabs
      socket.to(userId.toString()).emit("call:handled", { from: to });
    }
  });

  socket.on("call:reject", ({ to, reason }) => {
    if (to && userId) {
      delete socket.currentCallTarget;
      io.to(to.toString()).emit("call:rejected", {
        from: userId,
        reason: reason || "declined",
      });
      // Dismiss incoming ringing on other tabs
      socket.to(userId.toString()).emit("call:handled", { from: to });
    }
  });

  socket.on("call:end", ({ to }) => {
    delete socket.currentCallTarget;
    if (to && userId) {
      io.to(to.toString()).emit("call:ended", {
        from: userId,
      });
    }
  });

  socket.on("call:signal", ({ to, signal }) => {
    if (to && userId) {
      io.to(to.toString()).emit("call:signal", {
        from: userId,
        signal,
      });
    }
  });
});

export { io, app, server, userSocketMap };

