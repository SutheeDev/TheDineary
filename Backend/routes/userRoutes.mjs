import express from "express";
import { getUser, updateUser } from "../controllers/userController.mjs";
import authMiddleware from "../middleware/authMiddleware.mjs";
import {
  validate,
  userValidation,
} from "../middleware/validationMiddleware.mjs";

const router = express.Router();

router.use(authMiddleware);

router.route("/").get(getUser).patch(userValidation, validate, updateUser);

export default router;
