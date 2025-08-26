import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  console.warn("JWT_SECRET is not set. Please set it in your environment.");
}

export function signJwt(payload, options = {}) {
  const defaultOptions = { expiresIn: "7d" };
  return jwt.sign(payload, jwtSecret, { ...defaultOptions, ...options });
}

export function verifyJwt(token) {
  try {
    return jwt.verify(token, jwtSecret);
  } catch (_err) {
    return null;
  }
}


