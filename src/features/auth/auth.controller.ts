// api/v1/auth
//  /register
//  /login
// /logout

import express from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { UserService } from "./auth.service.ts";
import * as Types from "@shared/types/types.ts";
import { z } from "zod";
import { configDotenv } from "dotenv";
import findConfig from "find-config";
configDotenv({ path: findConfig(".env")! });

const router = express.Router();

const RegisterSchema = z.object({
  username: z
    .string()
    .min(5, "username must be at least 5 character")
    .max(30, "username must be less than 30 character")
    .transform((val) => val.trim().toLowerCase()),
  password: z
    .string()
    .min(8, "password too short")
    .max(30, "passord must be less than 30")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase and number",
    )
    .transform((val) => val.trim()),
  email: z.email("email format is not valid"),
});

const createAccessToken = (userId: string) => {
  if (!process.env.JWT_ACCESSTOKEN_SECRET)
    throw new Error("jwt access token secret is not provided");
  return jwt.sign({ sub: userId }, process.env.JWT_ACCESSTOKEN_SECRET, {
    expiresIn: "30m",
  });
};

const createRefreshToken = () => {
  const refreshTokenRaw = crypto.randomBytes(64).toString("hex");
  const maxAge = 15 * 24 * 60 * 60 * 1000;
  return { refreshTokenRaw, maxAge };
};

router.post("/register", async (req, res, next) => {
  const reqBody = RegisterSchema.safeParse(req.body);
  if (!reqBody.success) {
    return res.status(400).json({
      status: "fail",
      error: z.treeifyError(reqBody.error),
    });
  }
  try {
    const { refreshTokenRaw, maxAge } = createRefreshToken();
    const user = await UserService.register(
      reqBody.data,
      refreshTokenRaw,
      maxAge,
    );
    if (!user._id) throw new Error("user not created");
    const accessToken = createAccessToken(user._id.toString());
    res.cookie("access_token", accessToken, {
      sameSite: "strict",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 60 * 1000, //30min
    });
    res.cookie("refresh_token", refreshTokenRaw, {
      sameSite: "strict",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 24 * 60 * 60 * 1000, //15d
    });
    res.status(201).json({
      status: "success",
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
        },
      },
    });
  } catch (e) {
    next(e);
  }
});
