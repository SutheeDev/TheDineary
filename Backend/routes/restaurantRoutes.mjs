import express from "express";
import multer from "multer";
import {
  createRestaurant,
  getRestaurants,
  getSingleRestaurant,
  updateRestaurant,
  deleteRestaurant,
  uploadImage,
} from "../controllers/restaurantsController.mjs";
import authMiddleware from "../middleware/authMiddleware.mjs";
import {
  validate,
  restaurantValidation,
} from "../middleware/validationMiddleware.mjs";
import { BadRequestError } from "../errors/customErrors.mjs";

const router = express.Router();

// Keep the uploaded file in memory (never written to disk) so the controller can
// stream it straight to Cloudinary. Cap at 5MB and accept images only.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new BadRequestError("Only image files are allowed"));
    }
  },
});

router.use(authMiddleware);

// Translate multer's own errors (e.g. file too large) into a 400 so the client
// gets a clean client-error status and message instead of a generic 500.
// Accepts up to 20 files in one request under the "images" field.
const uploadMultiple = (req, res, next) => {
  upload.array("images", 20)(req, res, (err) => {
    if (err) {
      return next(new BadRequestError(err.message));
    }
    next();
  });
};

router.post("/upload", uploadMultiple, uploadImage);

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
