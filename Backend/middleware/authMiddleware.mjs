import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../errors/customErrors.mjs";

const authMiddleware = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    throw new UnauthorizedError("Authentication required");
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    throw new UnauthorizedError("Invalid or expired session");
  }
};

export default authMiddleware;
