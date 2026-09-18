import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { messageLimiter } from "../middleware/rateLimiter.middleware.js";
import {
  createStatus,
  getStatuses,
  markStatusViewed,
  deleteStatus,
} from "../controllers/status.controller.js";

const router = express.Router();

router.get("/", protectRoute, getStatuses);
router.post("/", protectRoute, messageLimiter, createStatus);
router.post("/view/:id", protectRoute, markStatusViewed);
router.delete("/:id", protectRoute, deleteStatus);

export default router;
