import { body, validationResult } from "express-validator";
import { BadRequestError } from "../errors/customErrors.mjs";

// Runs after a set of validation chains: if any failed, surface the first
// message as a BadRequestError so it flows through errorHandlerMiddleware.
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new BadRequestError(errors.array()[0].msg);
  }
  next();
};

const registerValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage("Name must be between 2 and 20 characters"),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

const loginValidation = [
  body("email").trim().isEmail().withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Please provide a password"),
];

// One category rating: required, 0.5 to 5, in half-star steps.
const ratingCategory = (field, label) =>
  body(`ratings.${field}`)
    .notEmpty()
    .withMessage(`${label} rating is required`)
    .bail()
    .isFloat({ min: 0.5, max: 5 })
    .withMessage(`${label} rating must be between 0.5 and 5`)
    .bail()
    .custom((value) => (Number(value) * 2) % 1 === 0)
    .withMessage(`${label} rating must be in half-star steps`)
    .toFloat();

const restaurantValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("visitDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("Visit date must be a valid date"),
  ratingCategory("food", "Food"),
  ratingCategory("service", "Service"),
  ratingCategory("ambience", "Ambience"),
  ratingCategory("value", "Value"),
  body("notes.food").optional().isString().trim(),
  body("notes.service").optional().isString().trim(),
  body("notes.ambience").optional().isString().trim(),
  body("notes.value").optional().isString().trim(),
  body("dishes")
    .optional()
    .isArray({ max: 50 })
    .withMessage("Too many dishes"),
  body("dishes.*.name")
    .trim()
    .notEmpty()
    .withMessage("Dish name is required"),
  body("dishes.*.note").optional().isString().trim(),
  body("priceRange")
    .optional()
    .isIn(["", "$", "$$", "$$$", "$$$$"])
    .withMessage("Invalid price range"),
  body("category")
    .optional()
    .isIn([
      "",
      "Restaurant",
      "Coffee Shop",
      "Bakery / Pastry",
      "Bar",
      "Dessert",
      "Street Food",
      "Other",
    ])
    .withMessage("Invalid category"),
  body("location.lat")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be between -90 and 90"),
  body("location.lng")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be between -180 and 180"),
  body("location.address").optional().isString().trim(),
  body("location.placeId").optional().isString().trim(),
  body("location.city").optional().isString().trim(),
  body("location.state").optional().isString().trim(),
  body("location.country").optional().isString().trim(),
  // Read-only Google data (H9): light optional checks only.
  body("google.website").optional().isString().trim(),
  body("google.hours").optional().isArray(),
  body("google.priceRange.startPrice").optional().isFloat(),
  body("google.priceRange.endPrice").optional().isFloat(),
  body("google.priceRange.currency").optional().isString().trim(),
  body("google.attributes").optional().isObject(),
];

export { validate, registerValidation, loginValidation, restaurantValidation };
