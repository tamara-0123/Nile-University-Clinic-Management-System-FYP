import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  handler: (req, res, next) => {
    res.status(429).json({
      success: false,
      message: "Too many login attempts. Try again later.",
    });
  },
});
