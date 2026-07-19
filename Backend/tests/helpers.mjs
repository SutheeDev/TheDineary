import request from "supertest";
import { app } from "../server.mjs";

// Register a user through the real endpoint and return the session cookie plus
// the user body. Restaurant tests use the cookie to make authenticated calls.
export const registerUser = async (overrides = {}) => {
  const payload = {
    name: "Test User",
    email: `user_${Date.now()}_${Math.random().toString(16).slice(2)}@example.com`,
    password: "password123",
    ...overrides,
  };
  const res = await request(app).post("/api/auth/register").send(payload);
  return { cookie: res.headers["set-cookie"], user: res.body, payload };
};

// A complete, valid restaurant body. Pass overrides to change or add fields.
export const validRestaurant = (overrides = {}) => ({
  name: "Test Cafe",
  cuisine: "Thai",
  ratings: { food: 4, service: 4, ambience: 4, value: 4 },
  ...overrides,
});
