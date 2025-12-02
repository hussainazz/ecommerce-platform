import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const accessToken = req.cookies?.access_token;
  if (!accessToken) {
    return res.status(401).json({
      error: "TOKEN_MISSING",
    });
  }
  try {
    if (!process.env.JWT_ACCESS_SECRET)
      throw new Error("JWT_ACCESS_SECRET not exist");
    const payload: any = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
    req.userId = payload.sub;
  } catch (err) {
    res.status(401).json({ error: "TOKEN_EXPIRED", action: "refresh" });
  }
}

export const requireUserId = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.userId) {
    return next(new Error("authentication required: userId missing"));
  }
  next();
};
