import rateLimit from "express-rate-limit";

// Rate limiter for authentication routes (login, signup)
// 15-minute window, maximum 25 attempts per IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many authentication requests from this IP. Please try again after 15 minutes.",
  },
});

// Rate limiter for sending messages
// 1-minute window, maximum 45 messages per IP
export const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 45,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "You are sending messages too quickly. Please wait a moment.",
  },
});
