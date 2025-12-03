import express from "express";
import type { Request, Response, NextFunction } from "express";
import { PaymentService } from "./payment.service.ts";
import { requireUserId } from "@shared/middlewares/auth.middleware.ts";
import { PaymentSchema } from "@shared/types/types.ts";
import axios from "axios";
import { z } from "zod/mini";
const router = express.Router();

const addPayment = async (req: Request, res: Response, next: NextFunction) => {
  const reqBody = PaymentSchema.safeParse(req.body);
  if (!reqBody.success) {
    return res.status(400).json({
      status: "fail",
      error: z.prettifyError(reqBody.error),
    });
  }
  try {
    const addedPayment = await PaymentService.create({
      ...reqBody.data,
      user_id: req.userId!,
    });
    const zarinPalRes = await axios.post(
      "https://sandbox.zarinpal.com/pg/v4/payment/request.json",
      {
        merchant_id: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        amount: reqBody.data.amount.toString(),
        callback_url: `http://${req.baseUrl}/verify`,
        description: "Order Payment.",
      },
    );
    if (zarinPalRes.data.message === "Success") {
      await PaymentService.addAuthority(
        addedPayment._id!,
        zarinPalRes.data.authority,
      );
    } else {
      throw new Error("payment session creation failed");
    }
    res.status(201).json({
      status: "success",
      addedPayment,
      sessionUrl: `http://sandbox.zarinpal.com/pg/StartPay/${zarinPalRes.data.authority}`,
    });
  } catch (e) {
    next(e);
  }
};

const verifyPayment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authority = req.query.Authority?.toString();
  const status = req.query.Status?.toString();
  if (!authority || !status) {
    return res.status(400);
  }

  try {
    if (status === "OK") {
      await PaymentService.success(authority);
    } else if (status === "NOK") {
      await PaymentService.fail(authority);
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

router.get("/verify", verifyPayment);
router.use(requireUserId);
router.get("/", retrievePayments);
router.post("/", addPayment);
router.get("/:id", retrievePaymentById);

export { router as paymentRouter };
