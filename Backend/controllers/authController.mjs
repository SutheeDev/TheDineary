import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authenticator } from "otplib";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.mjs";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../utils/sendEmail.mjs";
import { BadRequestError, UnauthorizedError } from "../errors/customErrors.mjs";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// clearCookie must match the cookie's original attributes to remove it, but
// Express 5 rejects maxAge here, so it is dropped.
const { maxAge, ...clearCookieOptions } = cookieOptions;

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

// Shared by the password reset and email verification flows: only the hash of
// an emailed token is ever stored, so a leaked database cannot be replayed.
const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

// Issue a fresh single-use verification link. Used by register, resend, and the
// email-change path in userController.
const issueVerificationEmail = async (user) => {
  const verifyToken = crypto.randomBytes(32).toString("hex");
  user.verifyEmailToken = hashToken(verifyToken);
  user.verifyEmailExpires = Date.now() + 24 * 60 * 60 * 1000;
  await user.save();

  await sendVerificationEmail({
    to: user.email,
    name: user.name,
    verifyUrl: `${process.env.CLIENT_URL}/verify-email/${verifyToken}`,
  });
};

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      throw new BadRequestError("An account with that email already exists");
    }

    // Hashing happens in the User model's pre("save") hook.
    const user = await User.create({ name, email, password });

    // Deliberately the opposite of forgotPassword, which rolls the token back
    // and throws: an account with no verification email is still perfectly
    // usable, so a failed send must not fail registration.
    try {
      await issueVerificationEmail(user);
    } catch (err) {
      console.error("Failed to send verification email:", err.message);
    }

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

    // A Google-only account has no password to compare against; treat it as a
    // failed login rather than letting bcrypt throw on an undefined hash.
    const user = await User.findOne({ email }).select("+password");
    if (!user || !user.password) {
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

// Sign in with Google: verify the ID token from the browser, then link or
// create an account and issue the normal session cookie. Skips the app's TOTP
// step because Google already handles identity verification.
const googleLogin = async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      throw new BadRequestError("Missing Google credential");
    }

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedError("Could not verify Google sign-in");
    }

    const { sub: googleId, email, name } = payload;

    let user = await User.findOne({ googleId });
    if (!user) {
      // Link Google to an existing password account with the same email.
      user = await User.findOne({ email });
      if (user) {
        user.googleId = googleId;
        await user.save();
      } else {
        // Google has already proven the address, so these accounts start
        // verified and are never sent a verification link.
        user = await User.create({ name, email, googleId, isVerified: true });
      }
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

    res.clearCookie("mfa_pending", clearCookieOptions);
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

// Step 1 of password reset: email a single-use link. The response is identical
// whether or not the account exists, so the endpoint cannot be used to find out
// who has a Dineary account.
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const genericResponse = {
      msg: "If that email is registered, a reset link is on its way.",
    };

    const user = await User.findOne({ email }).select("+password");

    // Google-only accounts have no password to reset; sending them a link would
    // let them set one and bypass Google sign-in.
    if (!user || !user.password) {
      return res.status(200).json(genericResponse);
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = hashToken(resetToken);
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    try {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl,
      });
    } catch (err) {
      // Do not leave a live token behind on an email that never arrived.
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      throw err;
    }

    res.status(200).json(genericResponse);
  } catch (err) {
    next(err);
  }
};

// Step 2: exchange the emailed token for a new password.
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: hashToken(token),
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new BadRequestError("This reset link is invalid or has expired");
    }

    // Hashing happens in the User model's pre("save") hook. Clearing the token
    // is what makes the link single-use.
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Anyone resetting a password should end up signed out everywhere, so the
    // session cookie on this browser goes too.
    res.clearCookie("token", clearCookieOptions);

    res.status(200).json({
      msg: "Password updated. You can now sign in with your new password.",
    });
  } catch (err) {
    next(err);
  }
};

// Exchange the emailed token for a verified account. A used, expired, or
// forged token all get the same 400, so a second click on a real link is
// indistinguishable from a guess.
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    const user = await User.findOne({
      verifyEmailToken: hashToken(token),
      verifyEmailExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new BadRequestError("This link is invalid or has expired");
    }

    // Clearing the token is what makes the link single-use.
    user.isVerified = true;
    user.verifyEmailToken = undefined;
    user.verifyEmailExpires = undefined;
    await user.save();

    res.status(200).json(sanitizeUser(user));
  } catch (err) {
    next(err);
  }
};

// Unlike register, a send failure here surfaces as an error: the user asked for
// this email, so silently doing nothing would be the wrong answer.
const resendVerification = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      throw new UnauthorizedError("Authentication required");
    }
    if (user.isVerified) {
      throw new BadRequestError("This email is already confirmed");
    }

    await issueVerificationEmail(user);

    res.status(200).json({ msg: "Confirmation email sent. Check your inbox." });
  } catch (err) {
    next(err);
  }
};

const logout = (req, res) => {
  res.clearCookie("token", clearCookieOptions);
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
  googleLogin,
  verifyTotp,
  setupTotp,
  verifySetup,
  disableTotp,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  issueVerificationEmail,
  logout,
  getMe,
};
