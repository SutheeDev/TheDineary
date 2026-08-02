import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import connectDB from "./config/db.mjs";
import errorHandlerMiddleware from "./middleware/errorHandlerMiddleware.mjs";

dotenv.config();
const app = express();

// Render puts a proxy in front of the service. Trust exactly one hop so
// express-rate-limit reads the real client IP from X-Forwarded-For instead of
// throttling every user as one shared address.
app.set("trust proxy", 1);

const port = process.env.PORT || 5000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.join(__dirname, "../Frontend/dist");

// Routes
import authRouter from "./routes/authRoutes.mjs";
import userRouter from "./routes/userRoutes.mjs";
import restaurantRouter from "./routes/restaurantRoutes.mjs";

// Request logging everywhere except tests: combined (standard web log) in
// production, the shorter dev format locally.
if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "https://maps.googleapis.com",
          "https://maps.gstatic.com",
          "https://accounts.google.com",
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https://res.cloudinary.com",
          "https://*.basemaps.cartocdn.com",
          "https://maps.googleapis.com",
          "https://maps.gstatic.com",
          "https://lh3.googleusercontent.com",
          "https://*.googleusercontent.com",
        ],
        connectSrc: [
          "'self'",
          "https://maps.googleapis.com",
          "https://places.googleapis.com",
          "https://accounts.google.com",
        ],
        frameSrc: ["'self'", "https://accounts.google.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        fontSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);
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

// In production the built frontend is served from this same origin. Guarded by
// existsSync because the test suite imports `app` without building the frontend,
// and an unguarded static mount would 404 the SPA fallback into every test.
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  // Any non-API GET returns the SPA shell so React Router deep links such as
  // /map or /ranking survive a hard refresh. /api misses fall through to the
  // JSON 404 below.
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

// Not Found Middleware (API misses, non-GET misses, and everything when the
// frontend build is absent)
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

// Tests import the configured app and drive it with an in-memory database, so
// skip connecting to the real DB and listening when running under Vitest.
if (process.env.NODE_ENV !== "test") {
  start();
}

export { app };
