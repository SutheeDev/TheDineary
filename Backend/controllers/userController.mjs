import User from "../models/User.mjs";
import {
  BadRequestError,
  NotFoundError,
  ServerError,
} from "../errors/customErrors.mjs";

const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      throw new NotFoundError(`No user found`);
    }

    res.status(200).json(user);
  } catch (error) {
    throw new ServerError("Something went wrong, please try again later");
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      throw new BadRequestError("Please fill in all required fields");
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: req.userId },
      req.body,
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      throw new NotFoundError(`No user found`);
    }

    res.status(200).json(updatedUser);
  } catch (err) {
    throw new ServerError("Something went wrong, please try again later");
  }
};

export { getUser, updateUser };
