import express from "express";
import {
  createRestaurant,
  getRestaurants,
  getSingleRestaurant,
  updateRestaurant,
  deleteRestaurant,
} from "../controllers/restaurantsController.mjs";
import authMiddleware from "../middleware/authMiddleware.mjs";

const router = express.Router();

router.use(authMiddleware);

router.route("/").post(createRestaurant).get(getRestaurants);
router
  .route("/:id")
  .get(getSingleRestaurant)
  .patch(updateRestaurant)
  .delete(deleteRestaurant);

export default router;
