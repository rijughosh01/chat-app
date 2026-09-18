import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import { io } from "../lib/socket.js";

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email });

    if (user) return res.status(400).json({ message: "Email already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      const token = generateToken(newUser._id, res);
      await newUser.save();

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
        bio: newUser.bio,
        showOnlineStatus: newUser.showOnlineStatus !== false,
        lastSeen: newUser.lastSeen,
        createdAt: newUser.createdAt,
        token,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id, res);

    user.lastSeen = new Date();
    await user.save();

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      bio: user.bio || "Hey there! I am using NexChat.",
      showOnlineStatus: user.showOnlineStatus !== false,
      lastSeen: user.lastSeen,
      createdAt: user.createdAt,
      token,
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", {
      maxAge: 0,
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
      secure: process.env.NODE_ENV !== "development",
    });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

function extractCloudinaryPublicId(url) {
  if (!url || typeof url !== "string") return null;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/);
  if (match && match[1]) {
    return match[1];
  }
  return url.split("/").pop()?.split(".")[0] || null;
}

export const updateProfile = async (req, res) => {
  try {
    const { profilePic, bio, fullName } = req.body;
    const userId = req.user._id;

    const updateFields = {};
    if (profilePic) {
      if (profilePic.startsWith("data:")) {
        if (req.user.profilePic && !req.user.profilePic.startsWith("/avatar")) {
          const oldPublicId = extractCloudinaryPublicId(req.user.profilePic);
          if (oldPublicId) {
            try {
              await cloudinary.uploader.destroy(oldPublicId);
            } catch (e) {
              console.error("Failed to destroy old Cloudinary avatar:", e.message);
            }
          }
        }
        const uploadResponse = await cloudinary.uploader.upload(profilePic);
        updateFields.profilePic = uploadResponse.secure_url;
      } else {
        updateFields.profilePic = profilePic;
      }
    }
    if (typeof bio === "string") {
      updateFields.bio = bio.trim();
    }
    if (typeof fullName === "string" && fullName.trim()) {
      updateFields.fullName = fullName.trim();
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: "No profile update fields provided" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateFields,
      { new: true }
    ).select("-password");

    // Broadcast live profile update to all connected clients
    io.emit("userProfileUpdated", {
      userId: updatedUser._id,
      profilePic: updatedUser.profilePic,
      user: updatedUser,
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkAuth = (req, res) => {
  try {
    const token =
      req.cookies?.jwt ||
      (req.headers?.authorization && req.headers.authorization.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null);
    const userData = req.user.toObject ? req.user.toObject() : req.user;
    res.status(200).json({ ...userData, token });
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updatePrivacySettings = async (req, res) => {
  try {
    const { showOnlineStatus } = req.body;
    const userId = req.user._id;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { showOnlineStatus: Boolean(showOnlineStatus) },
      { new: true }
    ).select("-password");

    io.emit("userPrivacyChanged", {
      userId,
      showOnlineStatus: updatedUser.showOnlineStatus !== false,
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("Error in updatePrivacySettings controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
