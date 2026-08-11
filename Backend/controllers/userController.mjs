import User from "../models/User.mjs";
import { issueVerificationEmail } from "./authController.mjs";
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

    const current = await User.findById(req.userId);
    if (!current) {
      throw new NotFoundError(`No user found`);
    }

    // Without this, verification would be trivially bypassed: verify an address
    // you own, then switch the account to someone else's and stay verified.
    const emailChanged = email !== undefined && email !== current.email;

    const updatedUser = await User.findOneAndUpdate(
      { _id: req.userId },
      {
        name,
        lastname,
        email,
        homeLocation,
        ...(emailChanged && { isVerified: false }),
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      throw new NotFoundError(`No user found`);
    }

    // Best effort, same reasoning as register: the profile save has already
    // succeeded and must not be undone by a mail failure.
    if (emailChanged) {
      try {
        await issueVerificationEmail(updatedUser);
      } catch (err) {
        console.error("Failed to send verification email:", err.message);
      }
    }

    res.status(200).json(updatedUser);
  } catch (err) {
    next(err);
  }
};

export { getUser, updateUser };
