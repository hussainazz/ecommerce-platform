import express from "express";
import * as auth from "@features/auth/auth.controller.ts";

export const routerV1 = express.Router();

routerV1.all("/auth", auth);
