import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { messageLimiter } from "../middleware/rateLimiter.middleware.js";
import {
  getMessages,
  getUsersForSidebar,
  sendMessage,
  deleteMessage,
  editMessage,
  markMessagesAsSeen,
  reactToMessage,
  getLinkPreview,
  updateChatSetting,
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/preview-url", protectRoute, getLinkPreview);
router.get("/:id", protectRoute, getMessages);

router.post("/send/:id", protectRoute, messageLimiter, sendMessage);
router.post("/settings/:id", protectRoute, updateChatSetting);
router.delete("/delete/:messageId", protectRoute, deleteMessage);
router.patch("/edit/:messageId", protectRoute, editMessage);
router.post("/seen", protectRoute, markMessagesAsSeen);
router.post("/react/:messageId", protectRoute, reactToMessage);

export default router;
