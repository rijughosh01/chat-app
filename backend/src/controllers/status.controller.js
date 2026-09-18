import Status from "../models/status.model.js";
import cloudinary from "../lib/cloudinary.js";
import { io } from "../lib/socket.js";

export const createStatus = async (req, res) => {
  try {
    const { type = "text", text, backgroundColor, fontFamily, image, caption } =
      req.body;
    const userId = req.user._id;

    let imageUrl = null;

    if (type === "image") {
      if (!image) {
        return res
          .status(400)
          .json({ message: "Image is required for image status" });
      }

      const uploadResponse = await cloudinary.uploader.upload(image, {
        folder: "chat_status",
      });
      imageUrl = uploadResponse.secure_url;
    } else {
      if (!text || !text.trim()) {
        return res
          .status(400)
          .json({ message: "Text is required for text status" });
      }
    }

    // Exact 24-hour expiration from now
    const expireAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const newStatus = new Status({
      userId,
      type,
      text: type === "text" ? text.trim() : undefined,
      backgroundColor: backgroundColor || "#005c4b",
      fontFamily: fontFamily || "sans",
      image: imageUrl,
      caption: caption ? caption.trim() : undefined,
      expireAt,
      viewers: [],
    });

    await newStatus.save();

    await newStatus.populate([
      { path: "userId", select: "fullName profilePic email" },
      { path: "viewers.userId", select: "fullName profilePic" },
    ]);

    // Broadcast live event to all connected users
    io.emit("newStatus", newStatus);

    res.status(201).json(newStatus);
  } catch (error) {
    console.error("Error in createStatus controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getStatuses = async (req, res) => {
  try {
    const loggedInUserId = req.user._id.toString();
    const now = new Date();

    // Fetch active statuses created in the last 24 hours
    const statuses = await Status.find({ expireAt: { $gt: now } })
      .sort({ createdAt: 1 })
      .populate("userId", "fullName profilePic email")
      .populate("viewers.userId", "fullName profilePic")
      .lean();

    const myStatuses = [];
    const userStatusMap = new Map();

    for (const status of statuses) {
      if (!status.userId) continue;
      const authorId = status.userId._id.toString();

      if (authorId === loggedInUserId) {
        myStatuses.push(status);
      } else {
        if (!userStatusMap.has(authorId)) {
          userStatusMap.set(authorId, {
            user: status.userId,
            statuses: [],
            hasUnviewed: false,
            lastUpdated: status.createdAt,
          });
        }

        const userGroup = userStatusMap.get(authorId);
        userGroup.statuses.push(status);
        userGroup.lastUpdated = status.createdAt;

        // Check if the current user has viewed this status
        const isViewedByMe = status.viewers.some(
          (v) => (v.userId?._id || v.userId)?.toString() === loggedInUserId
        );

        if (!isViewedByMe) {
          userGroup.hasUnviewed = true;
        }
      }
    }

    const otherUserStatuses = Array.from(userStatusMap.values());

    // Sort other users: those with unviewed updates come first, ordered by latest update
    otherUserStatuses.sort((a, b) => {
      if (a.hasUnviewed !== b.hasUnviewed) {
        return a.hasUnviewed ? -1 : 1;
      }
      return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
    });

    res.status(200).json({
      myStatuses,
      otherUserStatuses,
    });
  } catch (error) {
    console.error("Error in getStatuses controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const markStatusViewed = async (req, res) => {
  try {
    const { id: statusId } = req.params;
    const userId = req.user._id;

    const status = await Status.findById(statusId);
    if (!status) {
      return res.status(404).json({ message: "Status not found or expired" });
    }

    // Prevent duplicate viewer entries
    const alreadyViewed = status.viewers.some(
      (v) => v.userId.toString() === userId.toString()
    );

    if (!alreadyViewed) {
      const now = new Date();
      status.viewers.push({
        userId,
        viewedAt: now,
      });

      await status.save();

      // Emit live real-time notification to the status author
      io.emit("statusViewed", {
        statusId: status._id,
        authorId: status.userId.toString(),
        viewer: {
          userId: {
            _id: userId,
            fullName: req.user.fullName,
            profilePic: req.user.profilePic,
          },
          viewedAt: now,
        },
      });
    }

    res.status(200).json({ success: true, viewersCount: status.viewers.length });
  } catch (error) {
    console.error("Error in markStatusViewed controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteStatus = async (req, res) => {
  try {
    const { id: statusId } = req.params;
    const userId = req.user._id;

    const status = await Status.findById(statusId);
    if (!status) {
      return res.status(404).json({ message: "Status not found" });
    }

    if (status.userId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this status" });
    }

    // If it's an image status, clean up Cloudinary asset
    if (status.image) {
      try {
        const publicId = status.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`chat_status/${publicId}`);
      } catch (err) {
        console.warn("Could not delete status image from Cloudinary:", err.message);
      }
    }

    await Status.findByIdAndDelete(statusId);

    io.emit("statusDeleted", {
      statusId,
      userId: userId.toString(),
    });

    res.status(200).json({ message: "Status deleted successfully" });
  } catch (error) {
    console.error("Error in deleteStatus controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
