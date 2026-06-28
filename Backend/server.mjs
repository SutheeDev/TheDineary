import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import connectDB from "./config/db.mjs";
import errorHandlerMiddleware from "./middleware/errorHandlerMiddleware.mjs";

dotenv.config();
const app = express();

const port = process.env.PORT || 5000;

// Routes
import authRouter from "./routes/authRoutes.mjs";
import userRouter from "./routes/userRoutes.mjs";
import restaurantRouter from "./routes/restaurantRoutes.mjs";

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(helmet());
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/restaurants", restaurantRouter);

// Not Found Middleware
app.use("*", (req, res) => {
  res.status(404).json({ msg: "Not Found" });
});

// Error Middleware
app.use(errorHandlerMiddleware);

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(port, () => {
      console.log(`Server is running on port : ${port}`);
    });
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

start();
