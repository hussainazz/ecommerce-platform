import { UserService } from "@features/auth/auth.service.ts";
import type { Request, Response, NextFunction } from "express";

export const userProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.userId) {
    throw new Error("req.userId not exist");
  }
  let user;
  try {
    user = await UserService.findById(req.userId);
  } catch (e) {
    return next(e);
  }
  res.status(200).json({
    status: "success",
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
    },
  });
};
