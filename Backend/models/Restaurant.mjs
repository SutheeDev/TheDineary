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
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
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
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamp: true }
);

export default mongoose.model("Restaurant", restaurantSchema);
