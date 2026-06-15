import Restaurant from "../models/Restaurant.mjs";
import {
  NotFoundError,
  BadRequestError,
  ServerError,
} from "../errors/customErrors.mjs";

const createRestaurant = async (req, res) => {
  try {
    const userId = req.params.userId;

    const { name, visitDate, rating } = req.body;
    if (!name || !visitDate || !rating) {
      throw new BadRequestError("Please fill in all required fields");
    }

    req.body.userId = userId;

    const newRestaurant = await Restaurant.create(req.body);

    res.status(201).json(newRestaurant);
  } catch (error) {
    throw new ServerError("Something went wrong, please try again later");
  }
};

const getRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({
      userId: req.params.userId,
    }).sort({ visitDate: -1 });

    if (!restaurants || restaurants.length === 0) {
      throw new BadRequestError("You don't have any restaurant yet");
    }

    res.status(200).json(restaurants);
  } catch (error) {
    throw new ServerError("Something went wrong, please try again later");
  }
};

const getSingleRestaurant = async (req, res) => {
  try {
    const { userId, restaurantId } = req.params;
    const restaurant = await Restaurant.findOne({ _id: restaurantId, userId });

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
    const { userId, restaurantId } = req.params;
    const { name, visitDate, rating } = req.body;

    if (!name || !visitDate || !rating) {
      throw new BadRequestError("Please fill in all required fields");
    }

    const updatedRestaurant = await Restaurant.findOneAndUpdate(
      {
        _id: restaurantId,
        userId,
      },
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
    const { userId, restaurantId } = req.params;

    const deletedRestaurant = await Restaurant.findOneAndDelete({
      _id: restaurantId,
      userId,
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
