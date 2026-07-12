import mongoose from "mongoose";
import Restaurant from "../models/Restaurant.mjs";
import { NotFoundError } from "../errors/customErrors.mjs";

// Average the four category ratings and round to 1 decimal. The client only
// sends the ratings, never the score, so it is always derived server-side.
const computeFinalScore = (ratings) => {
  const { food, service, ambience, value } = ratings;
  return Math.round(((food + service + ambience + value) / 4) * 10) / 10;
};

// Store cuisines in one consistent shape so "thai", " Thai " and Google's "Thai"
// all become the same value and stop splitting into separate filter buckets:
// trim, collapse inner runs of spaces, then title-case each word (matching the
// format the Google Places auto-fill produces on the frontend).
const normalizeCuisine = (cuisine) => {
  if (typeof cuisine !== "string") return cuisine;
  return cuisine
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

// A filter value sent by the frontend meaning "entries with no value for this
// field" -- matches both an empty string and a missing/null field.
const NO_VALUE = "__none__";

const createRestaurant = async (req, res, next) => {
  try {
    req.body.userId = req.userId;

    if (req.body.ratings) {
      req.body.finalScore = computeFinalScore(req.body.ratings);
    }
    if (req.body.cuisine !== undefined) {
      req.body.cuisine = normalizeCuisine(req.body.cuisine);
    }

    const newRestaurant = await Restaurant.create(req.body);

    res.status(201).json(newRestaurant);
  } catch (err) {
    next(err);
  }
};

// Direct-field sorts (a plain .find().sort()). The unified "date" sort is handled
// separately because it sorts on a computed value (visitDate, else createdAt).
// Anything not listed here falls back to the "date" sort.
const SORT_FIELDS = {
  finalScore: "finalScore",
  name: "name",
  priceRange: "priceRange",
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
    // For each filter, the NO_VALUE sentinel means "find entries missing this
    // field" ($in [null, ""] catches both an empty string and an absent field);
    // any other value is an exact match as before.
    if (cuisine) {
      query.cuisine = cuisine === NO_VALUE ? { $in: [null, ""] } : cuisine;
    }
    if (priceRange) {
      query.priceRange =
        priceRange === NO_VALUE ? { $in: [null, ""] } : priceRange;
    }
    if (category) {
      query.category = category === NO_VALUE ? { $in: [null, ""] } : category;
    }

    const direction = order === "asc" ? 1 : -1;

    // Any sort that is not a known direct field is the unified "date" sort. It
    // orders by an entry's effective date: its visitDate, or its createdAt when
    // there is no visit date. That is a computed value, so it needs an
    // aggregation ($match does not auto-cast userId to an ObjectId like find does).
    let restaurants;
    if (SORT_FIELDS[sort]) {
      restaurants = await Restaurant.find(query).sort({
        [SORT_FIELDS[sort]]: direction,
      });
    } else {
      restaurants = await Restaurant.aggregate([
        { $match: { ...query, userId: new mongoose.Types.ObjectId(req.userId) } },
        { $addFields: { _effDate: { $ifNull: ["$visitDate", "$createdAt"] } } },
        { $sort: { _effDate: direction } },
        { $unset: "_effDate" },
      ]);
    }

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
    if (req.body.cuisine !== undefined) {
      req.body.cuisine = normalizeCuisine(req.body.cuisine);
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
