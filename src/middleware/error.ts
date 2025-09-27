import { NextFunction, Request, Response } from "express";
import { StatusCodes, getReasonPhrase } from "http-status-codes";

export function notFoundHandler(_req: Request, res: Response) {
  return res.status(StatusCodes.NOT_FOUND).json({
    status: "fail",
    message: "Route not found",
  });
}

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const status = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  const msg = err.message || getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR);

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  return res.status(status).json({
    status: "error",
    message: msg,
  });
}
