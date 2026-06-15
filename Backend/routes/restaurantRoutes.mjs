import express from "express";
import {
  createRestaurant,
  getRestaurants,
  getSingleRestaurant,
  updateRestaurant,
  deleteRestaurant,
} from "../controllers/restaurantsController.mjs";

const router = express.Router();

router.route("/:userId").post(createRestaurant).get(getRestaurants);
router
  .route("/:userId/:restaurantId")
  .get(getSingleRestaurant)
  .patch(updateRestaurant)
  .delete(deleteRestaurant);

export default router;
