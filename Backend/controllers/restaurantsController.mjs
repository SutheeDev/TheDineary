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

const getRestaurants = async (req, res, next) => {
  try {
    const restaurants = await Restaurant.find({
      userId: req.userId,
    }).sort({ visitDate: -1 });

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
