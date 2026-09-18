import mongoose from "mongoose";

const statusSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["text", "image"],
      required: true,
      default: "text",
    },
    // For text status
    text: {
      type: String,
      maxlength: 700,
    },
    backgroundColor: {
      type: String,
      default: "#005c4b", // WhatsApp signature green
    },
    fontFamily: {
      type: String,
      default: "sans", // 'sans', 'serif', 'mono', 'cursive', 'display'
    },
    // For image status
    image: {
      type: String,
    },
    caption: {
      type: String,
      maxlength: 300,
    },
    // Viewers tracking
    viewers: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // 24-hour expiration date with automatic MongoDB TTL index
    expireAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
  },
  { timestamps: true }
);

statusSchema.index({ userId: 1, createdAt: -1 });

const Status = mongoose.model("Status", statusSchema);

export default Status;
