import Restaurant from "../models/Restaurant.mjs";
import {
  NotFoundError,
  BadRequestError,
  ServerError,
} from "../errors/customErrors.mjs";

const createRestaurant = async (req, res) => {
  try {
    const { name, visitDate, rating } = req.body;
    if (!name || !visitDate || !rating) {
      throw new BadRequestError("Please fill in all required fields");
    }

    req.body.userId = req.userId;

    const newRestaurant = await Restaurant.create(req.body);

    res.status(201).json(newRestaurant);
  } catch (error) {
    throw new ServerError("Something went wrong, please try again later");
  }
};

const getRestaurants = async (req, res) => {
  const restaurants = await Restaurant.find({
    userId: req.userId,
  }).sort({ visitDate: -1 });

  res.status(200).json(restaurants);
};

const getSingleRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }

    res.status(200).json(restaurant);
  } catch (error) {
    throw new ServerError("Something went wrong, please try again later");
  }
};

const updateRestaurant = async (req, res) => {
  try {
    const { name, visitDate, rating } = req.body;

    if (!name || !visitDate || !rating) {
      throw new BadRequestError("Please fill in all required fields");
    }

    const updatedRestaurant = await Restaurant.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );

    res.status(200).json(updatedRestaurant);
  } catch (error) {
    throw new ServerError("Something went wrong, please try again later");
  }
};

const deleteRestaurant = async (req, res) => {
  try {
    const deletedRestaurant = await Restaurant.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    res.status(200).json(deletedRestaurant);
  } catch (error) {
    throw new ServerError("Something went wrong, please try again later");
  }
};

export {
  createRestaurant,
  getRestaurants,
  getSingleRestaurant,
  updateRestaurant,
  deleteRestaurant,
};
