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
    dishes: [
      {
        name: { type: String, trim: true, required: true },
        note: { type: String, trim: true },
      },
    ],
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
    category: {
      type: String,
      enum: [
        "",
        "Restaurant",
        "Coffee Shop",
        "Bakery / Pastry",
        "Bar",
        "Dessert",
        "Street Food",
        "Other",
      ],
    },
    // Ordered list of photos. images[0] is the cover shown on the card. Each
    // holds the hosted url, its Cloudinary publicId (used to delete the file
    // when an image is removed), and an optional caption. An empty array means
    // no photo; the frontend falls back to a placeholder for display.
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, default: "" },
        caption: { type: String, default: "" },
      },
    ],
    location: {
      address: { type: String },
      lat: { type: Number },
      lng: { type: Number },
      placeId: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String },
    },
    // Read-only data pulled from Google Places when a restaurant is picked via
    // search. Optional; manual entries have none. attributes is a loose bag of
    // whichever amenity/service booleans came back true (see PlaceSearch.jsx).
    google: {
      hours: [{ type: String }],
      website: { type: String },
      priceRange: {
        startPrice: { type: Number },
        endPrice: { type: Number },
        currency: { type: String },
      },
      attributes: { type: Schema.Types.Mixed },
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Restaurant", restaurantSchema);
