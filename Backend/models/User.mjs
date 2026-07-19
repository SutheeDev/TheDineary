import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minLength: 2,
    maxLength: 20,
    trim: true,
  },
  lastname: {
    type: String,
    maxLength: 20,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  // Required only for password accounts. Google accounts have no password.
  // select: false keeps the hash out of query results unless a query opts in
  // with .select("+password").
  password: {
    type: String,
    required: function () {
      return !this.googleId;
    },
    minLength: 6,
    select: false,
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  totpSecret: {
    type: String,
  },
  totpEnabled: {
    type: Boolean,
    default: false,
  },
  // Password reset. Only the SHA-256 hash of the token is stored: the raw token
  // lives in the emailed link, so a leaked database cannot be used to reset
  // anyone's password. select: false for the same deny-by-default reason as the
  // password hash.
  resetPasswordToken: {
    type: String,
    select: false,
  },
  resetPasswordExpires: {
    type: Date,
    select: false,
  },
  // Saved home address used as the map's starting point when the browser cannot
  // provide a live location. Same shape as a restaurant's location.
  homeLocation: {
    line1: { type: String },
    city: { type: String },
    state: { type: String },
    postalCode: { type: String },
    country: { type: String },
    address: { type: String },
    lat: { type: Number },
    lng: { type: Number },
  },
});

// Hash on every save path, so no caller has to remember to. The isModified
// guard matters: without it, saving a user for an unrelated reason (enabling
// 2FA, linking Google) would re-hash the stored hash and break their login.
// Note this does not run for findOneAndUpdate and other query-level updates.
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

export default mongoose.model("User", userSchema);
