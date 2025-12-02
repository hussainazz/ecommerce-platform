import express from "express";
import type { Request, Response, NextFunction } from "express";
import { PaymentService } from "./payment.service.ts";
import { requireUserId } from "@shared/middlewares/auth.middleware.ts";

const router = express.Router();

const addPayment = async (req: Request, res: Response, next: NextFunction) => {
  const order_id = req.body.orderId;
  if (!order_id) {
    return res.status(400).json({
      error: "orderId must provided",
    });
  }
  try {
    const result = await PaymentService.create({
      order_id,
      user_id: req.userId!,
    });
    res.status(201).json({
      status: "success",
      result,
    });
  } catch (e) {
    next(e);
  }
};

const retrievePaymentById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.params.id) {
    return res.status(400).json({
      error: "payment id not provided",
    });
  }
  try {
    const result = await PaymentService.findById(req.params.id, req.userId!);
    return res.status(200).json({
      status: "success",
      result,
    });
  } catch (e) {
    next(e);
  }
};

const retrievePayments = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await PaymentService.findAll(req.userId!);
    return res.status(200).json({
      status: "success",
      result,
    });
  } catch (e) {
    next(e);
  }
};

const updatePaymentStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.params.id) {
    return res.status(400).json({
      error: "payment id is required",
    });
  }
  if (!req.query.status) {
    return res.status(400).json({
      error: "status query is required",
    });
  }

  try {
    if (req.query.status === "success") {
      await PaymentService.success(req.params.id!);
    } else if (req.query.status === "fail") {
      await PaymentService.fail(req.params.id!);
    } else {
      return res.status(400).json({
        error: "Invalid status",
      });
    }
    res.status(200).json({
      status: "success",
      message: "payment status updated",
    });
  } catch (e) {
    next(e);
  }
};

router.use(requireUserId);
router.get("/", retrievePayments);
router.post("/", addPayment);
router.get("/:id", retrievePaymentById);
router.patch("/:id", updatePaymentStatus);

export { router as paymentRouter };
