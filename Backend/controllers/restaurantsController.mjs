import Restaurant from "../models/Restaurant.mjs";
import { NotFoundError } from "../errors/customErrors.mjs";

// Average the four category ratings and round to 1 decimal. The client only
// sends the ratings, never the score, so it is always derived server-side.
const computeFinalScore = (ratings) => {
  const { food, service, ambience, value } = ratings;
  return Math.round(((food + service + ambience + value) / 4) * 10) / 10;
};

const createRestaurant = async (req, res, next) => {
  try {
    req.body.userId = req.userId;

    if (req.body.ratings) {
      req.body.finalScore = computeFinalScore(req.body.ratings);
    }

    const newRestaurant = await Restaurant.create(req.body);

    res.status(201).json(newRestaurant);
  } catch (err) {
    next(err);
  }
};

// Only these fields may be sorted on. Anything else falls back to visitDate,
// so a bad or malicious ?sort value can never reach the query untouched.
const SORT_FIELDS = {
  visitDate: "visitDate",
  finalScore: "finalScore",
  name: "name",
  priceRange: "priceRange",
  createdAt: "createdAt",
};

const getRestaurants = async (req, res, next) => {
  try {
    const { search, cuisine, priceRange, category, sort, order } = req.query;

    const query = { userId: req.userId };

    if (search) {
      // Escape regex specials so input like "(" cannot throw or match oddly.
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.name = { $regex: escaped, $options: "i" };
    }
    if (cuisine) {
      query.cuisine = cuisine;
    }
    if (priceRange) {
      query.priceRange = priceRange;
    }
    if (category) {
      query.category = category;
    }

    const field = SORT_FIELDS[sort] || "visitDate";
    const direction = order === "asc" ? 1 : -1;

    const restaurants = await Restaurant.find(query).sort({ [field]: direction });

    res.status(200).json(restaurants);
  } catch (err) {
    next(err);
  }
};

const getSingleRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }

    res.status(200).json(restaurant);
  } catch (err) {
    next(err);
  }
};

const updateRestaurant = async (req, res, next) => {
  try {
    if (req.body.ratings) {
      req.body.finalScore = computeFinalScore(req.body.ratings);
    }

    const updatedRestaurant = await Restaurant.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );

    if (!updatedRestaurant) {
      throw new NotFoundError("Restaurant not found");
    }

    res.status(200).json(updatedRestaurant);
  } catch (err) {
    next(err);
  }
};

const deleteRestaurant = async (req, res, next) => {
  try {
    const deletedRestaurant = await Restaurant.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!deletedRestaurant) {
      throw new NotFoundError("Restaurant not found");
    }

    res.status(200).json(deletedRestaurant);
  } catch (err) {
    next(err);
  }
};

export {
  createRestaurant,
  getRestaurants,
  getSingleRestaurant,
  updateRestaurant,
  deleteRestaurant,
};
