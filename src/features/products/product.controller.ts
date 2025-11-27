// /products/:id

import express from "express";
import type { Request, Response, NextFunction } from "express";
import { ProductService } from "./product.service.ts";

export const router = express.Router();

const retriveProductById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.body) {
    return res.status(400).json({
      error: "BODY_NOT_PROVIDED",
    });
  }
  if (!req.body.id || typeof req.body.id === "string") {
    return res.status(400).json({
      error: "PRODUCT_ID_NOT_PROVIDED",
    });
  }
  try {
    const product = await ProductService.findById(req.body.id);
    if (!product) {
      return res.status(404).json({
        status: "fail",
        error: "PRODUCT_NOT_FOUND",
      });
    }
    res.status(200).json({
      status: "success",
      product: {
        id: product._id,
        title: product.title,
        price: product.price,
        category: product.category,
        inventory: product.inventory,
        description: product.description,
      },
    });
  } catch (e) {
    next(e);
  }
};

router.get("/:id", retriveProductById);
