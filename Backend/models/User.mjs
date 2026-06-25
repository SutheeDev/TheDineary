import mongoose from "mongoose";

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
  password: {
    type: String,
    required: function () {
      return !this.googleId;
    },
    minLength: 6,
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
});

export default mongoose.model("User", userSchema);
