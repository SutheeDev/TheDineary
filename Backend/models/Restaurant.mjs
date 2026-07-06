import mongoose from "mongoose";
const { Schema } = mongoose;

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    cuisine: {
      type: String,
    },
    visitDate: {
      type: Date,
      required: true,
    },
    ratings: {
      food: { type: Number, min: 0.5, max: 5, required: true },
      service: { type: Number, min: 0.5, max: 5, required: true },
      ambience: { type: Number, min: 0.5, max: 5, required: true },
      value: { type: Number, min: 0.5, max: 5, required: true },
    },
    notes: {
      food: { type: String },
      service: { type: String },
      ambience: { type: String },
      value: { type: String },
    },
    finalScore: {
      type: Number,
      min: 0.5,
      max: 5,
    },
    review: {
      type: String,
    },
    priceRange: {
      type: String,
      enum: ["", "$", "$$", "$$$", "$$$$"],
    },
    image: {
      type: String,
      default:
        "https://res.cloudinary.com/dnc7potxo/image/upload/v1738184597/DineDiary/placeholder-image.png",
    },
    location: {
      address: { type: String },
      lat: { type: Number },
      lng: { type: Number },
      placeId: { type: String },
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Restaurant", restaurantSchema);
