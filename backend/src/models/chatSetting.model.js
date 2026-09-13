import mongoose from "mongoose";

const chatSettingSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    disappearingTimer: {
      type: Number,
      default: 0, // 0 = Off, 60 = 1 min (demo), 86400 = 24h, 604800 = 7d, 7776000 = 90d
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

chatSettingSchema.index({ participants: 1 });

const ChatSetting = mongoose.model("ChatSetting", chatSettingSchema);

export default ChatSetting;
