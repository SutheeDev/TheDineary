import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import Restaurant from "../models/Restaurant.mjs";
import { NotFoundError, BadRequestError } from "../errors/customErrors.mjs";

// Average the four category ratings and round to 1 decimal. The client only
// sends the ratings, never the score, so it is always derived server-side.
const computeFinalScore = (ratings) => {
  const { food, service, ambience, value } = ratings;
  return Math.round(((food + service + ambience + value) / 4) * 10) / 10;
};

// Store cuisines in one consistent shape so "thai", " Thai " and Google's "Thai"
// all become the same value and stop splitting into separate filter buckets:
// trim, collapse inner runs of spaces, then title-case each word (matching the
// format the Google Places auto-fill produces on the frontend).
const normalizeCuisine = (cuisine) => {
  if (typeof cuisine !== "string") return cuisine;
  return cuisine
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

// A filter value sent by the frontend meaning "entries with no value for this
// field" -- matches both an empty string and a missing/null field.
const NO_VALUE = "__none__";

// Point the Cloudinary SDK at our account. Called at request time (not import
// time) so the secrets are read after dotenv has loaded them; module top-level
// runs before dotenv.config().
const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};

// Best-effort delete of hosted image files from Cloudinary. Skips entries with
// no publicId (e.g. legacy single-image data). Never throws: a failed cleanup
// should not fail the user's save or delete.
const destroyImages = async (images = []) => {
  const ids = images.map((img) => img?.publicId).filter(Boolean);
  await Promise.all(
    ids.map((id) =>
      cloudinary.uploader.destroy(id).catch((err) => {
        console.error(`Failed to delete Cloudinary image ${id}:`, err.message);
      })
    )
  );
};

const createRestaurant = async (req, res, next) => {
  try {
    req.body.userId = req.userId;

    if (req.body.ratings) {
      req.body.finalScore = computeFinalScore(req.body.ratings);
    }
    if (req.body.cuisine !== undefined) {
      req.body.cuisine = normalizeCuisine(req.body.cuisine);
    }

    const newRestaurant = await Restaurant.create(req.body);

    res.status(201).json(newRestaurant);
  } catch (err) {
    next(err);
  }
};

// Direct-field sorts (a plain .find().sort()). The unified "date" sort is handled
// separately because it sorts on a computed value (visitDate, else createdAt).
// Anything not listed here falls back to the "date" sort.
const SORT_FIELDS = {
  finalScore: "finalScore",
  name: "name",
  priceRange: "priceRange",
};

const getRestaurants = async (req, res, next) => {
  try {
    const { search, cuisine, priceRange, category, sort, order } = req.query;

    const query = { userId: req.userId };

    if (search) {
      // Escape regex specials so input like "(" cannot throw or match oddly.
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.name = { $regex: escaped, $options: "i" };
    }
    // For each filter, the NO_VALUE sentinel means "find entries missing this
    // field" ($in [null, ""] catches both an empty string and an absent field);
    // any other value is an exact match as before.
    if (cuisine) {
      query.cuisine = cuisine === NO_VALUE ? { $in: [null, ""] } : cuisine;
    }
    if (priceRange) {
      query.priceRange =
        priceRange === NO_VALUE ? { $in: [null, ""] } : priceRange;
    }
    if (category) {
      query.category = category === NO_VALUE ? { $in: [null, ""] } : category;
    }

    const direction = order === "asc" ? 1 : -1;

    // Any sort that is not a known direct field is the unified "date" sort. It
    // orders by an entry's effective date: its visitDate, or its createdAt when
    // there is no visit date. That is a computed value, so it needs an
    // aggregation ($match does not auto-cast userId to an ObjectId like find does).
    let restaurants;
    if (SORT_FIELDS[sort]) {
      restaurants = await Restaurant.find(query).sort({
        [SORT_FIELDS[sort]]: direction,
      });
    } else {
      restaurants = await Restaurant.aggregate([
        { $match: { ...query, userId: new mongoose.Types.ObjectId(req.userId) } },
        { $addFields: { _effDate: { $ifNull: ["$visitDate", "$createdAt"] } } },
        { $sort: { _effDate: direction } },
        { $unset: "_effDate" },
      ]);
    }

    res.status(200).json(restaurants);
  } catch (err) {
    next(err);
  }
};

const getSingleRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!restaurant) {
      throw new NotFoundError("Restaurant not found");
    }

    res.status(200).json(restaurant);
  } catch (err) {
    next(err);
  }
};

const updateRestaurant = async (req, res, next) => {
  try {
    if (req.body.ratings) {
      req.body.finalScore = computeFinalScore(req.body.ratings);
    }
    if (req.body.cuisine !== undefined) {
      req.body.cuisine = normalizeCuisine(req.body.cuisine);
    }

    // Load the current entry first so we can tell which images the user removed
    // and delete just those files from Cloudinary after the save succeeds.
    const existing = await Restaurant.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!existing) {
      throw new NotFoundError("Restaurant not found");
    }

    const updatedRestaurant = await Restaurant.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );

    // If the update changed the image list, remove any image that is no longer
    // present (matched by publicId) from Cloudinary so we don't leave orphans.
    if (Array.isArray(req.body.images)) {
      const keptIds = new Set(
        updatedRestaurant.images.map((img) => img.publicId).filter(Boolean)
      );
      const removed = existing.images.filter(
        (img) => img.publicId && !keptIds.has(img.publicId)
      );
      if (removed.length) {
        configureCloudinary();
        await destroyImages(removed);
      }
    }

    res.status(200).json(updatedRestaurant);
  } catch (err) {
    next(err);
  }
};

const deleteRestaurant = async (req, res, next) => {
  try {
    const deletedRestaurant = await Restaurant.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!deletedRestaurant) {
      throw new NotFoundError("Restaurant not found");
    }

    // Clean up this entry's hosted photos so deleting a restaurant doesn't leave
    // its files behind on Cloudinary.
    if (deletedRestaurant.images?.length) {
      configureCloudinary();
      await destroyImages(deletedRestaurant.images);
    }

    res.status(200).json(deletedRestaurant);
  } catch (err) {
    next(err);
  }
};

// Stream a single in-memory file to Cloudinary and resolve to its hosted url
// and publicId (the id is stored so the file can later be deleted).
const streamToCloudinary = (file) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "DineDiary" },
      (error, uploaded) =>
        error
          ? reject(error)
          : resolve({ url: uploaded.secure_url, publicId: uploaded.public_id })
    );
    stream.end(file.buffer);
  });

// Receive one or more image files (held in memory by multer) and stream them to
// Cloudinary using the server-side secret, so no upload credential is ever
// exposed to the browser. Returns the hosted images for the frontend to store.
const uploadImage = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw new BadRequestError("No image file provided");
    }

    configureCloudinary();

    const images = await Promise.all(req.files.map(streamToCloudinary));

    res.status(200).json({ images });
  } catch (err) {
    next(err);
  }
};

export {
  createRestaurant,
  getRestaurants,
  getSingleRestaurant,
  updateRestaurant,
  deleteRestaurant,
  uploadImage,
};
