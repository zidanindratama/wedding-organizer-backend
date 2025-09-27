import { Request, Response } from "express";
import { prisma } from "@/db/prisma.js";
import { comparePassword } from "@/utils/password.js";
import { signToken } from "@/utils/jwt.js";
import { StatusCodes } from "http-status-codes";

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as { email: string; password: string };
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ status: "fail", message: "Invalid credentials" });
  }
  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ status: "fail", message: "Invalid credentials" });
  }

  const token = signToken({
    userId: user.id,
    role: user.role,
    email: user.email,
  });
  return res.json({
    status: "success",
    data: {
      accessToken: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
  });
}
