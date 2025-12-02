import express from "express";
import type { Request, Response, NextFunction } from "express";
import { ReviewService } from "./review.service.ts";
import { requireUserId } from "@shared/middlewares/auth.middleware.ts";

const router = express.Router({ mergeParams: true });

const retrieveReviews = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { productId } = req.params;
  try {
    const result = await ReviewService.findProductReviews(productId!);
    res.status(200).json({
      status: "success",
      result,
    });
  } catch (e) {
    next(e);
  }
};

const addReview = async (req: Request, res: Response, next: NextFunction) => {
  const product_id = req.params.productId!;
  const user_id = req.userId!;
  const { rate, comment } = req.body;
  if (!rate || ![1, 2, 3, 4, 5].includes(rate)) {
    return res
      .status(400)
      .json({ error: "rate is required with value of 1/2/3/4/5" });
  }
  try {
    const result = await ReviewService.add({
      product_id,
      user_id,
      rate,
      comment,
    });
    res.status(201).json({
      status: "success",
      result,
    });
  } catch (e) {
    next(e);
  }
};

const retrieveReviewById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await ReviewService.findById(req.params.reviewId!);
    res.status(200).json({
      status: "success",
      result,
    });
  } catch (e) {
    next(e);
  }
};

const deleteReview = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await ReviewService.delete(req.params.reviewId!, req.userId!);
    res.status(200).json({
      status: "success",
    });
  } catch (e) {
    next(e);
  }
};

router.get("/", retrieveReviews);
router.get("/:reviewId", retrieveReviewById);

router.use(requireUserId);
router.post("/", addReview);
router.delete("/:reviewId", deleteReview);

export { router as reviewRouter };
