// api/v1/auth
//  /register
//  /login

import express from "express";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { UserService } from "./auth.service.ts";
import { z } from "zod";
import { configDotenv } from "dotenv";
import findConfig from "find-config";
configDotenv({ path: findConfig(".env")! });

const router = express.Router();

router.post("/register", async (req, res, next) => {
  const reqBody = RegisterSchema.safeParse(req.body);
  if (!reqBody.success) {
    return res.status(400).json({
      status: "fail",
      error: z.treeifyError(reqBody.error),
    });
  }
  try {
    const user = await UserService.register(reqBody.data);
    if (!user._id) throw new Error("user not created");
    const { jti, tokenRaw, maxAgeRefToken } = createRefreshToken(
      user._id.toString(),
    );
    const accessToken = createAccessToken(user._id.toString());
    await UserService.storeToken(
      jti,
      user._id.toString(),
      tokenRaw,
      maxAgeRefToken,
    );
    res.cookie("access_token", accessToken, {
      sameSite: "strict",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("refresh_token", tokenRaw, {
      sameSite: "strict",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: maxAgeRefToken,
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

router.post("/login", async (req, res, next) => {
  const reqBody = LoginSchema.safeParse(req.body);
  if (!reqBody.success) {
    return res.status(400).json({
      status: "fail",
      error: z.treeifyError(reqBody.error),
    });
  }
  const userId = await UserService.findIdByUsername(reqBody.data.username);
  if (!userId) {
    return res.status(406).json({
      message: "username mismatch",
    });
  }
  const user = await UserService.findByPassword(
    userId.toString(),
    reqBody.data.password,
  );
  if (!user) {
    return res.status(401).json({
      message: "password is wrong",
    });
  }
  const accessToken = createAccessToken(userId);
  const { jti, tokenRaw, maxAgeRefToken } = createRefreshToken(userId);
  await UserService.storeToken(jti, userId, tokenRaw, maxAgeRefToken);
  res.cookie("access_token", accessToken, {
    sameSite: "strict",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refresh_token", tokenRaw, {
    sameSite: "strict",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: maxAgeRefToken,
  });
  res.status(200).json({
    status: "success",
    message: "authentication successfull",
  });
});

router.post("/refresh", async (req, res, next) => {
  const tokenRaw = req.cookies.refresh_token;
  if (!tokenRaw) {
    return res.status(401).json({ error: "no token" });
  }

  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error("JWT_REFRESH_SECRET not provided");
  }
  let payload: any;
  try {
    payload = jwt.verify(tokenRaw, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    return res.status(401).json({ error: "invalid refresh token" });
  }

  const token = await UserService.findToken(payload.jti);
  if (token === null) return res.status(401).json({ error: "token not exist" });
  const isMatch = await bcrypt.compare(tokenRaw, token.tokenHash);
  if (!isMatch) return res.status(401).json({ error: "token mismatch" });

  const accessToken = createAccessToken(token.userId);
  res.cookie("access_token", accessToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "productoin",
  });
  res.status(201).json({
    status: "success",
    message: "token generated",
  });
});

router.post("/logout", async (req, res, next) => {
  if (!req.cookies) {
    return res.status(401).json({
      error: "no cookies present",
    });
  }
  const refreshToken = req.cookies.refresh_token;
  if (!refreshToken) {
    return res.status(401);
  }
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error("JWT_REFRESH_SECRET not exist");
  }
  let payload: any;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET) as any;
  } catch (err) {
    return res.status(401).json({ error: "invalid token" });
  }
  const isDeleted = await UserService.deleteToken(payload.jti);
  if (!isDeleted) {
    return res.status(404).json({
      error: "token no longer exist",
    });
  }
  res.clearCookie("access_token");
  res.clearCookie("refresh_token");
  return res.status(200).json({
    status: "success",
    message: "sessions deleted successfully",
  });
});

const createAccessToken = (userId: string) => {
  if (!process.env.JWT_ACCESS_SECRET)
    throw new Error("jwt access token secret is not provided");
  return jwt.sign({ sub: userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: "15m",
  });
};

const createRefreshToken = (userId: string) => {
  if (!process.env.JWT_REFRESH_SECRET)
    throw new Error("JWT_REFRESH_SECRET isn't provided");
  const jti = uuidv4();
  const tokenRaw = jwt.sign(
    { sub: userId, jti },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "30d" },
  );
  const maxAgeRefToken = 30 * 24 * 60 * 60 * 1000;
  return { jti, userId, tokenRaw, maxAgeRefToken };
};

const RegisterSchema = z.object({
  username: z
    .string()
    .min(5, "username must be at least 5 character")
    .max(30, "username must be less than 30 character")
    .transform((val) => val.trim().toLowerCase()),
  password: z
    .string()
    .min(8, "password too short")
    .max(30, "Passwordord must be less than 30")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase and number",
    )
    .transform((val) => val.trim()),
  email: z.email("email format is not valid"),
});

const LoginSchema = z.object({
  username: z
    .string()
    .min(5, "username must be at least 5 character")
    .max(30, "username must be less than 30 character")
    .transform((val) => val.trim().toLowerCase()),
  password: z
    .string()
    .min(8, "password too short")
    .max(30, "Password must be less than 30")
    .transform((val) => val.trim()),
});
