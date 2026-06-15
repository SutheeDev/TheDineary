import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.mjs";
import { BadRequestError, UnauthorizedError } from "../errors/customErrors.mjs";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      throw new BadRequestError("Please fill in all required fields");
    }

    const existing = await User.findOne({ email });
    if (existing) {
      throw new BadRequestError("An account with that email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    const token = signToken(user._id);
    res.cookie("token", token, cookieOptions);

    const { password: _, ...userData } = user.toObject();
    res.status(201).json(userData);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new BadRequestError("Please provide email and password");
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const token = signToken(user._id);
    res.cookie("token", token, cookieOptions);

    const { password: _, ...userData } = user.toObject();
    res.status(200).json(userData);
  } catch (err) {
    next(err);
  }
};

const logout = (req, res) => {
  res.clearCookie("token", { httpOnly: true, sameSite: "lax" });
  res.status(200).json({ msg: "Logged out" });
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

export { register, login, logout, getMe };
