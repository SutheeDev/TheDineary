import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authenticator } from "otplib";
import User from "../models/User.mjs";
import { BadRequestError, UnauthorizedError } from "../errors/customErrors.mjs";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// Short-lived cookie that marks a half-authenticated session waiting for a TOTP code.
const mfaPendingCookieOptions = {
  ...cookieOptions,
  maxAge: 5 * 60 * 1000,
};

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const signMfaPendingToken = (userId) =>
  jwt.sign({ userId, mfaPending: true }, process.env.JWT_SECRET, {
    expiresIn: "5m",
  });

// Remove sensitive fields before sending a user to the client.
const sanitizeUser = (user) => {
  const { password, totpSecret, ...safe } = user.toObject();
  return safe;
};

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

    res.status(201).json(sanitizeUser(user));
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

    // If 2FA is on, hold off on the real session cookie until the code is verified.
    if (user.totpEnabled) {
      const pendingToken = signMfaPendingToken(user._id);
      res.cookie("mfa_pending", pendingToken, mfaPendingCookieOptions);
      return res.status(200).json({ mfaRequired: true });
    }

    const token = signToken(user._id);
    res.cookie("token", token, cookieOptions);

    res.status(200).json(sanitizeUser(user));
  } catch (err) {
    next(err);
  }
};

// Second login step: verify the TOTP code against the mfa_pending cookie.
const verifyTotp = async (req, res, next) => {
  try {
    const { token: code } = req.body;
    const pendingToken = req.cookies?.mfa_pending;

    if (!pendingToken) {
      throw new UnauthorizedError("No pending login. Please sign in again.");
    }
    if (!code) {
      throw new BadRequestError("Please provide your authentication code");
    }

    let payload;
    try {
      payload = jwt.verify(pendingToken, process.env.JWT_SECRET);
    } catch {
      throw new UnauthorizedError("Login session expired. Please sign in again.");
    }
    if (!payload.mfaPending) {
      throw new UnauthorizedError("Invalid login session");
    }

    const user = await User.findById(payload.userId);
    if (!user || !user.totpEnabled) {
      throw new UnauthorizedError("Two-factor authentication is not enabled");
    }

    const isValid = authenticator.verify({ token: code, secret: user.totpSecret });
    if (!isValid) {
      throw new UnauthorizedError("Invalid authentication code");
    }

    res.clearCookie("mfa_pending", cookieOptions);
    const token = signToken(user._id);
    res.cookie("token", token, cookieOptions);

    res.status(200).json(sanitizeUser(user));
  } catch (err) {
    next(err);
  }
};

// Begin 2FA setup: generate a secret and return the otpauth URL for a QR code.
const setupTotp = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      throw new UnauthorizedError("Authentication required");
    }
    if (user.totpEnabled) {
      throw new BadRequestError("Two-factor authentication is already enabled");
    }

    const secret = authenticator.generateSecret();
    user.totpSecret = secret;
    await user.save();

    const otpauthUrl = authenticator.keyuri(user.email, "Dineary", secret);
    res.status(200).json({ otpauthUrl });
  } catch (err) {
    next(err);
  }
};

// Confirm setup: verify the first code, then turn 2FA on.
const verifySetup = async (req, res, next) => {
  try {
    const { token: code } = req.body;
    if (!code) {
      throw new BadRequestError("Please provide your authentication code");
    }

    const user = await User.findById(req.userId);
    if (!user || !user.totpSecret) {
      throw new BadRequestError("Start two-factor setup first");
    }

    const isValid = authenticator.verify({ token: code, secret: user.totpSecret });
    if (!isValid) {
      throw new BadRequestError("Invalid authentication code");
    }

    user.totpEnabled = true;
    await user.save();

    res.status(200).json(sanitizeUser(user));
  } catch (err) {
    next(err);
  }
};

const disableTotp = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      throw new UnauthorizedError("Authentication required");
    }

    user.totpSecret = undefined;
    user.totpEnabled = false;
    await user.save();

    res.status(200).json(sanitizeUser(user));
  } catch (err) {
    next(err);
  }
};

const logout = (req, res) => {
  res.clearCookie("token", cookieOptions);
  res.status(200).json({ msg: "Logged out" });
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("-password -totpSecret");
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

export {
  register,
  login,
  verifyTotp,
  setupTotp,
  verifySetup,
  disableTotp,
  logout,
  getMe,
};
