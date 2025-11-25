// globalErrorHandler.ts
import type { Request, Response, NextFunction } from "express";

export default function globalErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.error(err.stack);

  err.statusCode = err.statusCode || 500;
  err.status = err.statusCode.toString().startsWith("4") ? "fail" : "error";

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message || "Something went wrong!",
  });
}
