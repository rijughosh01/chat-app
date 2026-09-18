import { Server } from "socket.io";
import http from "http";
import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      callback(null, true);
    },
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

// Helper to safely parse cookies from handshake headers
function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  const cookies = {};
  cookieHeader.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    const name = parts[0]?.trim();
    const value = parts.slice(1).join("=").trim();
    if (name) {
      try {
        cookies[name] = decodeURIComponent(value);
      } catch {
        cookies[name] = value;
      }
    }
  });
  return cookies;
}

// Socket authentication middleware: verify JWT from handshake auth token or cookie
io.use((socket, next) => {
  try {
    const cookies = parseCookies(socket.handshake.headers?.cookie);
    const token = socket.handshake.auth?.token || cookies.jwt;

    if (!token) {
      if (process.env.NODE_ENV === "development" && socket.handshake.query?.userId) {
        socket.userId = socket.handshake.query.userId.toString();
        return next();
      }
      return next(new Error("Authentication error: No authentication token provided"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.userId) {
      return next(new Error("Authentication error: Invalid token"));
    }

    socket.userId = decoded.userId.toString();
    next();
  } catch (err) {
    console.error("Socket authentication error:", err.message);
    next(new Error("Authentication error: Unauthorized"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.userId;

  console.log(`Socket connected: ${socket.id} (User: ${userId || "Anonymous"})`);

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

      // WhatsApp Catch-up Delivery:
      // Any messages sent to this user while they were offline are now marked DELIVERED!
      if (mongoose.Types.ObjectId.isValid(userId)) {
        Message.find({ receiverId: userId, delivered: false })
          .select("_id senderId")
          .then(async (pendingMsgs) => {
            if (pendingMsgs && pendingMsgs.length > 0) {
              await Message.updateMany(
                { receiverId: userId, delivered: false },
                { $set: { delivered: true } }
              );

              // Group by sender and notify each sender that their messages have arrived
              const senderGroups = {};
              pendingMsgs.forEach((msg) => {
                const sId = msg.senderId.toString();
                if (!senderGroups[sId]) senderGroups[sId] = [];
                senderGroups[sId].push(msg._id);
              });

              Object.keys(senderGroups).forEach((sId) => {
                io.to(sId).emit("messagesDelivered", {
                  receiverId: userId,
                  messageIds: senderGroups[sId],
                });
              });
            }
          })
          .catch((err) =>
            console.error("Error updating undelivered messages on connect:", err.message)
          );
      }
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
          if (mongoose.Types.ObjectId.isValid(userId)) {
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
          }
        } catch (err) {
          console.error("Error updating lastSeen on disconnect:", err);
        }
      }
    }
  });

  socket.on("typing", ({ to, from }) => {
    if (to) {
      io.to(to.toString()).emit("typing", { from: userId || from });
    }
  });

  socket.on("stopTyping", ({ to, from }) => {
    if (to) {
      io.to(to.toString()).emit("stopTyping", { from: userId || from });
    }
  });

  // Fast-path real-time message transmission via WebSocket (<30ms roundtrip)
  socket.on("sendMessage", async (data, callback) => {
    try {
      if (!userId) {
        if (typeof callback === "function") callback({ error: "Unauthorized" });
        return;
      }

      const { receiverId, text, image, audio, audioDuration, sticker, replyTo } = data || {};
      if (!receiverId || !mongoose.Types.ObjectId.isValid(receiverId)) {
        if (typeof callback === "function") callback({ error: "Valid receiver ID required" });
        return;
      }

      const { createMessageCore } = await import("../controllers/message.controller.js");
      const user = await User.findById(userId).select("fullName profilePic");

      const newMessage = await createMessageCore({
        senderId: userId,
        receiverId,
        text,
        image,
        audio,
        audioDuration,
        sticker,
        replyTo,
        user: user || { _id: userId, fullName: "User", profilePic: "/avatar.png" },
      });

      if (typeof callback === "function") {
        callback({ status: "ok", message: newMessage });
      }
    } catch (err) {
      console.error("Error in socket sendMessage handler:", err.message);
      if (typeof callback === "function") {
        callback({ error: err.message || "Failed to send message" });
      }
    }
  });

  // WhatsApp Delivery Receipt: recipient device confirms packet arrival
  socket.on("ackDelivery", async ({ messageId, senderId }) => {
    try {
      if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) return;
      await Message.findByIdAndUpdate(messageId, { delivered: true });
      if (senderId) {
        io.to(senderId.toString()).emit("messageDelivered", {
          messageId,
          receiverId: userId,
        });
      }
    } catch (err) {
      console.error("Error in ackDelivery handler:", err.message);
    }
  });

  // WhatsApp Read Receipt: recipient opens/views chat with sender (<10ms via WebSocket)
  socket.on("markMessagesAsSeen", async ({ senderId }) => {
    try {
      if (!userId || !senderId) return;
      if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(senderId)) return;
      await Message.updateMany(
        { senderId, receiverId: userId, seen: false },
        { $set: { seen: true, delivered: true } }
      );
      io.to(senderId.toString()).emit("messagesSeen", { by: userId });
    } catch (err) {
      console.error("Error in socket markMessagesAsSeen handler:", err.message);
    }
  });
});

export { io, app, server, userSocketMap };

