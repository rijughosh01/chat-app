import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getVapidPublicKey,
  subscribe,
  unsubscribe,
  getNotificationStatus,
  sendTestNotification,
} from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/vapid-key", protectRoute, getVapidPublicKey);
router.get("/status", protectRoute, getNotificationStatus);
router.post("/subscribe", protectRoute, subscribe);
router.post("/unsubscribe", protectRoute, unsubscribe);
router.post("/test", protectRoute, sendTestNotification);

export default router;
