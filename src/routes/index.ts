import express from "express";
import { router as authRouter } from "@features/auth/auth.controller.ts";
import { router as productRouter } from "@features/products/product.controller.ts";
import { authMiddleware } from "@shared/middlewares/auth.middleware.ts";
import { router as userRouter } from "@features/users/users.router.ts";

export const routerV1 = express.Router();

routerV1.use("/auth", authRouter);
routerV1.use("/products", productRouter);
routerV1.use("/users", authMiddleware, userRouter);
