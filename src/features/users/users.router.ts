import express from "express";
import { userProfile } from "./users.controller.ts";

export const router = express.Router();

router.use("/me", userProfile);
router.use("/me/orders");
router.use("/me/payments");
