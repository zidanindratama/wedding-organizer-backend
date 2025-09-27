import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";
import { StatusCodes } from "http-status-codes";

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "fail",
        message: "Validation error",
        issues: parsed.error.flatten(),
      });
    }
    req.body = parsed.data;
    next();
  };
}
