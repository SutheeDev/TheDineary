import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import connectDB from "./config/db.mjs";
import errorHandlerMiddleware from "./middleware/errorHandlerMiddleware.mjs";

// test
import { body, validationResult } from "express-validator";

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

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/restaurants", restaurantRouter);

// Express-Validation Test Route
app.post(
  "/api/v1/test",
  [body("name").notEmpty().withMessage("Name is required")],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => error.msg);
      return res.status(400).json({ errors: errorMessages });
    }
    next();
  },
  (req, res) => {
    const { name } = req.body;
    res.json({ message: `hello ${name}` });
  }
);

// Not Found Middleware
app.use("*", (req, res) => {
  res.status(404).json({ msg: "Not Found" });
});

// Error Middleware
app.use(errorHandlerMiddleware);
// app.use((err, req, res, next) => {
//   res.status(500).json({ msg: "Something went wrong" });
// });

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
