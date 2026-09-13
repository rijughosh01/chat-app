import express from "express";
import {
  checkAuth,
  login,
  logout,
  signup,
  updateProfile,
  updatePrivacySettings,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { authLimiter } from "../middleware/rateLimiter.middleware.js";

const router = express.Router();

router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.post("/logout", logout);

router.put("/update-profile", protectRoute, updateProfile);
router.put("/update-privacy", protectRoute, updatePrivacySettings);

router.get("/check", protectRoute, checkAuth);

export default router;
