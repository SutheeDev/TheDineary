import User from "../models/User.mjs";
import { NotFoundError } from "../errors/customErrors.mjs";

const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      throw new NotFoundError(`No user found`);
    }

    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    // Only these fields may be written. Anything else in req.body (password,
    // totpEnabled, googleId) is ignored.
    const { name, lastname, email, homeLocation } = req.body;

    const updatedUser = await User.findOneAndUpdate(
      { _id: req.userId },
      { name, lastname, email, homeLocation },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      throw new NotFoundError(`No user found`);
    }

    res.status(200).json(updatedUser);
  } catch (err) {
    next(err);
  }
};

export { getUser, updateUser };
