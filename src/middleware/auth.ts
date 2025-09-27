import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { verifyToken } from "src/utils/jwt";

export type AuthUser = {
  userId: string;
  role: "ADMIN" | "USER";
  email: string;
};

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ status: "fail", message: "Missing token" });
  }
  const token = auth.slice("Bearer ".length);
  try {
    const payload = verifyToken(token) as AuthUser;
    req.user = payload;
    next();
  } catch {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ status: "fail", message: "Invalid token" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "ADMIN") {
    return res
      .status(StatusCodes.FORBIDDEN)
      .json({ status: "fail", message: "Admin only" });
  }
  next();
}
