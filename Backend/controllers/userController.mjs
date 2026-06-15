import User from "../models/User.mjs";
import {
  BadRequestError,
  NotFoundError,
  ServerError,
} from "../errors/customErrors.mjs";

const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      throw new NotFoundError(`No user with id of ${req.params.id}`);
    }

    res.status(200).json(user);
  } catch (error) {
    throw new ServerError("Something went wrong, please try again later");
  }
};

const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email } = req.body;

    if (!name || !email) {
      throw new BadRequestError("Please fill in all required fields");
    }

    const updatedUser = await User.findOneAndUpdate({ _id: userId }, req.body, {
      new: true,
    });

    if (!updatedUser) {
      throw new NotFoundError(`No user with id of ${userId}`);
    }

    res.status(200).json(updatedUser);
  } catch (err) {
    throw new ServerError("Something went wrong, please try again later");
  }
};

export { getUser, updateUser };
