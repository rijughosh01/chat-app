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

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const receiverSocketId = getReceiverSocketId(receiverId);
    const delivered = !!receiverSocketId;

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      delivered, 
      seen: false, 
    });

    await newMessage.save();

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