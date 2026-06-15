import express from "express";
import { register, login, logout, getMe } from "../controllers/authController.mjs";
import authMiddleware from "../middleware/authMiddleware.mjs";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", authMiddleware, getMe);

export default router;
