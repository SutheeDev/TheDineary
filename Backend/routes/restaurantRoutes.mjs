import express from "express";
import {
  createRestaurant,
  getRestaurants,
  getSingleRestaurant,
  updateRestaurant,
  deleteRestaurant,
} from "../controllers/restaurantsController.mjs";
import authMiddleware from "../middleware/authMiddleware.mjs";
import {
  validate,
  restaurantValidation,
} from "../middleware/validationMiddleware.mjs";

const router = express.Router();

router.use(authMiddleware);

router
  .route("/")
  .post(restaurantValidation, validate, createRestaurant)
  .get(getRestaurants);
router
  .route("/:id")
  .get(getSingleRestaurant)
  .patch(restaurantValidation, validate, updateRestaurant)
  .delete(deleteRestaurant);

export default router;
