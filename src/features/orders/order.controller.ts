import express from "express";
import z from "zod";
import type { Request, Response, NextFunction } from "express";
import { OrderService } from "./order.service.ts";
import { orderItemsScehema, OrderSchema } from "@shared/types/types.ts";
const router = express.Router();

const retrieveOrders = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.userId) {
    throw new Error("req.userId not exist");
  }
  const orders = await OrderService.findUserOrders(req.userId);
  res.status(200).json({
    status: "success",
    orders,
  });
};

const retrieveOrderById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.userId) {
    throw new Error("req.userId not exist");
  }
  if (!req.params.id) {
    throw new Error("req.paramas.id not exist");
  }
  const userOrders = await OrderService.findUserOrders(req.userId);
  const order = userOrders.find((ord) => ord.user_id === req.params.id);
  if (!order) {
    return res.status(404).json({
      status: "fail",
      message: "ORDER_NOT_FOUND",
    });
  }
  res.status(200).json({
    status: "success",
    order,
  });
};

const addOrder = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.userId) {
    throw new Error("req.userId not exist");
  }
  const reqBody = OrderSchema.safeParse(req.body);
  if (!reqBody.success) {
    return res.status(400).json({
      status: "fail",
      error: z.prettifyError(reqBody.error),
    });
  }
  try {
    const result = await OrderService.create({
      user_id: req.userId,
      shipping_address: reqBody.data.shipping_address,
      products: reqBody.data.products,
    });
    res.status(201).json({
      status: "success",
      result,
    });
  } catch (e) {
    next(e);
  }
};

const deleteOrder = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.userId) {
    throw new Error("req.userId not exist");
  }
  if (!req.params.id) {
    return res.status(400).json({
      error: "id of order not provided",
    });
  }
  try {
    await OrderService.delete(req.params.id);
  } catch (e) {
    return next(e);
  }
  res.status(200).json({
    status: "success",
  });
};

const updateOrderItems = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.userId) {
    throw new Error("req.userId not exist");
  }
  if (!req.params.id) {
    return res.status(400).json({
      error: "order id not provided",
    });
  }
  const reqBody = orderItemsScehema.safeParse(req.body);
  if (!reqBody.success) {
    return res.status(400).json({
      status: "fail",
      error: z.prettifyError(reqBody.error),
    });
  }
  try {
    await OrderService.updateItems(req.params.id, reqBody.data);
    res.status(200).json({
      status: "success",
    });
  } catch (e) {
    next(e);
  }
};

const updateOrderStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.userId) {
    throw new Error("req.userId not exist");
  }
  if (!req.params.id) {
    return res.status(400).json({
      error: "order id not provided",
    });
  }
  if (req?.query?.status !== "cancel" || "confirm" || "complete") {
    return res.status(400).json({
      error: "status is invalid",
    });
  }
  try {
    await OrderService[req.query.status](req.params.id);
    res.status(200).json({
      status: "success",
    });
  } catch (e) {
    next(e);
  }
};

router.route("/").get(retrieveOrders).post(addOrder);
router
  .route("/:id")
  .get(retrieveOrderById)
  .delete(deleteOrder)
  .put(updateOrderItems)
  .patch(updateOrderStatus);

export { router as orderRouter };
