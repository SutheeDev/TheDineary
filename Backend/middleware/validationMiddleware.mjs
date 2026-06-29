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

const restaurantValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("visitDate")
    .notEmpty()
    .withMessage("Visit date is required")
    .bail()
    .isISO8601()
    .withMessage("Visit date must be a valid date"),
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be a whole number between 1 and 5")
    .toInt(),
  body("priceRange")
    .optional()
    .isIn(["", "$", "$$", "$$$", "$$$$"])
    .withMessage("Invalid price range"),
];

export { validate, registerValidation, loginValidation, restaurantValidation };
