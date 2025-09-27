import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { env } from "@/config/env.js";

export interface AuthPayload extends JwtPayload {
  userId: string;
  role: "ADMIN" | "USER";
  email: string;
}

export function signToken(payload: object, opts: SignOptions = {}) {
  const options: SignOptions = { expiresIn: env.jwtExpiresIn, ...opts };
  return jwt.sign(payload, env.jwtSecret, options);
}

export function verifyToken(token: string) {
  return jwt.verify(token, env.jwtSecret) as AuthPayload | string;
}

export function verifyAuth(token: string): AuthPayload {
  const decoded = jwt.verify(token, env.jwtSecret);
  if (typeof decoded === "string") {
    throw new Error("Invalid token payload");
  }
  return decoded as AuthPayload;
}
