import express from "express";
import { router as authRouter } from "@features/auth/auth.controller.ts";
import { router as productRouter } from "@features/products/product.controller.ts";

export const routerV1 = express.Router();

routerV1.all("/auth", authRouter);
routerV1.all("/products", productRouter);
