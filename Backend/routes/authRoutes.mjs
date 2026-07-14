import express from "express";
import rateLimit from "express-rate-limit";
import {
  register,
  login,
  googleLogin,
  verifyTotp,
  setupTotp,
  verifySetup,
  disableTotp,
  logout,
  getMe,
} from "../controllers/authController.mjs";
import authMiddleware from "../middleware/authMiddleware.mjs";
import {
  validate,
  registerValidation,
  loginValidation,
} from "../middleware/validationMiddleware.mjs";

const router = express.Router();

// Limit brute-force attempts on routes that accept a guessable secret
// (password or 6-digit TOTP code): 10 requests per 15 minutes per IP.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { msg: "Too many attempts. Please try again later." },
  // Tests fire many auth requests in a row; skip the limit under Vitest so the
  // shared per-IP counter does not turn into confusing 429 failures.
  skip: () => process.env.NODE_ENV === "test",
});

router.post("/register", authLimiter, registerValidation, validate, register);
router.post("/login", authLimiter, loginValidation, validate, login);
router.post("/google", googleLogin);
router.post("/totp/verify", authLimiter, verifyTotp);
router.post("/totp/setup", authMiddleware, setupTotp);
router.post("/totp/verify-setup", authMiddleware, verifySetup);
router.post("/totp/disable", authMiddleware, disableTotp);
router.post("/logout", logout);
router.get("/me", authMiddleware, getMe);

export default router;
