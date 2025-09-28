import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
export function signToken(payload, opts = {}) {
    const options = { expiresIn: env.jwtExpiresIn, ...opts };
    return jwt.sign(payload, env.jwtSecret, options);
}
export function verifyToken(token) {
    return jwt.verify(token, env.jwtSecret);
}
export function verifyAuth(token) {
    const decoded = jwt.verify(token, env.jwtSecret);
    if (typeof decoded === "string") {
        throw new Error("Invalid token payload");
    }
    return decoded;
}
