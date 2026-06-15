import express from "express";
import { getUser, updateUser } from "../controllers/userController.mjs";
import authMiddleware from "../middleware/authMiddleware.mjs";

const router = express.Router();

router.use(authMiddleware);

router.route("/").get(getUser).patch(updateUser);

export default router;
