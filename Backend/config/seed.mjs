import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "./db.mjs";
import User from "../models/User.mjs";
import Restaurant from "../models/Restaurant.mjs";
import users from "./seedUser.mjs";
import restaurants from "./seedRestaurant.mjs";

dotenv.config();

const seed = async () => {
  try {
    await connectDB(process.env.MONGO_URI);

    await User.deleteMany({});
    await User.create(users);

    await Restaurant.deleteMany({});
    await Restaurant.create(restaurants);

    console.log(
      `Seeded ${users.length} users and ${restaurants.length} restaurants.`
    );
  } catch (error) {
    console.log({ err: error.message });
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

seed();
