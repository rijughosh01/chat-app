import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    const usersWithChatDetails = await Promise.all(
      filteredUsers.map(async (user) => {
        const lastMessage = await Message.findOne({
          $or: [
            { senderId: loggedInUserId, receiverId: user._id },
            { senderId: user._id, receiverId: loggedInUserId },
          ],
        }).sort({ createdAt: -1 });

        const unreadCount = await Message.countDocuments({
          senderId: user._id,
          receiverId: loggedInUserId,
          seen: false,
        });

        return {
          ...user.toObject(),
          lastMessage: lastMessage
            ? {
                text: lastMessage.text,
                image: lastMessage.image,
                audio: lastMessage.audio,
                audioDuration: lastMessage.audioDuration,
                createdAt: lastMessage.createdAt,
                senderId: lastMessage.senderId,
              }
            : null,
          unreadCount,
        };
      })
    );

    usersWithChatDetails.sort((a, b) => {
      const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    res.status(200).json(usersWithChatDetails);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const { cursor, limit = 30 } = req.query;
    const myId = req.user._id;

    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 30, 1), 100);

    const filter = {
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    };

    if (cursor) {
      filter.createdAt = { $lt: new Date(cursor) };
    }

    const messages = await Message.find(filter)
      .sort({ createdAt: -1 })
      .limit(limitNum + 1)
      .populate({
        path: "replyTo",
        select: "text image audio senderId",
        populate: { path: "senderId", select: "fullName" },
      });

    const hasMore = messages.length > limitNum;
    const pagedMessages = hasMore ? messages.slice(0, limitNum) : messages;

    // Return in chronological order (oldest to newest)
    const chronologicalMessages = pagedMessages.reverse();

    const nextCursor =
      hasMore && chronologicalMessages.length > 0
        ? chronologicalMessages[0].createdAt
        : null;

    res.status(200).json({
      messages: chronologicalMessages,
      hasMore,
      nextCursor,
    });
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, audio, audioDuration, replyTo } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    let audioUrl;
    if (audio) {
      try {
        const base64Data = audio.includes(";base64,")
          ? audio.split(";base64,").pop()
          : audio;
        const buffer = Buffer.from(base64Data, "base64");

        const uploadResponse = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: "video",
              folder: "chat_audio",
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );
          uploadStream.end(buffer);
        });

        audioUrl = uploadResponse.secure_url;
      } catch (uploadError) {
        console.error("Cloudinary audio buffer upload error, trying fallback:", uploadError);
        const sanitizedAudio = audio.replace(/;codecs=[^;]+/, "");
        const fallbackResponse = await cloudinary.uploader.upload(sanitizedAudio, {
          resource_type: "video",
          folder: "chat_audio",
        });
        audioUrl = fallbackResponse.secure_url;
      }
    }

    const receiverSocketId = getReceiverSocketId(receiverId);
    const delivered = !!receiverSocketId;

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      audio: audioUrl,
      audioDuration: audioDuration || 0,
      delivered, 
      seen: false, 
      replyTo: replyTo || null,
    });

    await newMessage.save();

    if (newMessage.replyTo) {
      await newMessage.populate({
        path: "replyTo",
        select: "text image audio senderId",
        populate: { path: "senderId", select: "fullName" },
      });
    }

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    if (
      message.senderId.toString() !== userId.toString() &&
      message.receiverId.toString() !== userId.toString()
    ) {
      return res
        .status(403)
        .json({ error: "Unauthorized to delete this message" });
    }
    if (message.image) {
      const publicId = message.image.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(publicId);
    }

    await Message.findByIdAndDelete(messageId);

    const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("deleteMessage", { _id: messageId });
    }

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.log("Error in deleteMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;
    const { text, image } = req.body;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    if (message.senderId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ error: "Unauthorized to edit this message" });
    }

    let imageUrl = message.image;
    if (image && image !== message.image) {
      if (message.image) {
        const publicId = message.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      }
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    message.text = text !== undefined ? text : message.text;
    message.image = imageUrl;
    await message.save();

    const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("editMessage", message);
    }

    res.status(200).json(message);
  } catch (error) {
    console.log("Error in editMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markMessagesAsSeen = async (req, res) => {
  try {
    const { userId } = req.body; 
    const myId = req.user._id;
    await Message.updateMany(
      { senderId: userId, receiverId: myId, seen: false },
      { $set: { seen: true } }
    );
    const senderSocketId = getReceiverSocketId(userId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesSeen", { by: myId });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const reactToMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (!emoji) {
      return res.status(400).json({ error: "Emoji is required" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Ensure user is authorized (sender or receiver of this message)
    if (
      message.senderId.toString() !== userId.toString() &&
      message.receiverId.toString() !== userId.toString()
    ) {
      return res.status(403).json({ error: "Unauthorized to react to this message" });
    }

    if (!message.reactions) {
      message.reactions = [];
    }

    const existingReactionIndex = message.reactions.findIndex(
      (r) => r.userId.toString() === userId.toString()
    );

    if (existingReactionIndex > -1) {
      // Toggle off if clicking the same emoji
      if (message.reactions[existingReactionIndex].emoji === emoji) {
        message.reactions.splice(existingReactionIndex, 1);
      } else {
        // Change to the new emoji
        message.reactions[existingReactionIndex].emoji = emoji;
      }
    } else {
      // Add reaction
      message.reactions.push({ userId, emoji });
    }

    await message.save();

    // Notify the other user via socket
    const otherUserId =
      message.senderId.toString() === userId.toString()
        ? message.receiverId.toString()
        : message.senderId.toString();

    const otherSocketId = getReceiverSocketId(otherUserId);
    if (otherSocketId) {
      io.to(otherSocketId).emit("messageReaction", {
        messageId: message._id,
        reactions: message.reactions,
      });
    }

    res.status(200).json(message);
  } catch (error) {
    console.error("Error in reactToMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};