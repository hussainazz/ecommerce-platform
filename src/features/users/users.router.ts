import express from "express";
import { userProfile } from "./users.controller.ts";
import { orderRouter } from "@features/orders/order.controller.ts";

export const router = express.Router();

router.use("/me", userProfile);
router.use("/me/orders", orderRouter);
router.use("/me/payments");
