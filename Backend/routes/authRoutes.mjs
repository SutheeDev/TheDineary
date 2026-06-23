import express from "express";
import {
  register,
  login,
  verifyTotp,
  setupTotp,
  verifySetup,
  disableTotp,
  logout,
  getMe,
} from "../controllers/authController.mjs";
import authMiddleware from "../middleware/authMiddleware.mjs";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/totp/verify", verifyTotp);
router.post("/totp/setup", authMiddleware, setupTotp);
router.post("/totp/verify-setup", authMiddleware, verifySetup);
router.post("/totp/disable", authMiddleware, disableTotp);
router.post("/logout", logout);
router.get("/me", authMiddleware, getMe);

export default router;
