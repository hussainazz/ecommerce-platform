import { ObjectId } from "mongodb";
import { orderCollection } from "@db/schemas/order.schema.ts";
import * as Types from "@shared/types/types.ts";
import { check, z } from "zod/mini";
import { productCollection } from "@db/schemas/product.schema.ts";
import { isObjectIdOrHexString } from "mongoose";
import { ProductService } from "@features/products/product.service.ts";

export class OrderService {
  static async create(
    data: Pick<Types.Order, "shipping_address" | "products" | "user_id">,
  ): Promise<Types.Order> {
    const orderProducts = data.products;
    const orderProducts_IDs = orderProducts.map((prod) => {
      if (!ObjectId.isValid(prod.product_id)) {
        throw new Error("product id not valid");
      } else {
        return prod.product_id;
      }
    });
    const findProducts = await Promise.all(
      orderProducts_IDs.map((prodId) =>
        productCollection.findOne({ _id: new ObjectId(prodId) }),
      ),
    );
    if (findProducts.some((el) => !el)) {
      throw new Error("at least one product id not exist");
    }

    let totalPrice = 0;
    const productStockMap = new Map();
    for (const fndProd of findProducts) {
      productStockMap.set(fndProd?._id.toString(), fndProd);
    }
    for (const ordProd of orderProducts) {
      const prodPrice = productStockMap.get(ordProd.product_id).price;
      const prodStock = productStockMap.get(ordProd.product_id).stock;
      if (ordProd.count > prodStock) {
        throw new Error(`product id ${ordProd.product_id} is out of stock`);
      }
      totalPrice += prodPrice * ordProd.count;
      await ProductService.decreaseStock(ordProd.product_id, ordProd.count);
    }

    const created_at = Date.now();
    const result = await orderCollection.insertOne({
      ...data,
      created_at,
      totalPrice,
    });
    return {
      _id: result.insertedId.toString(),
      status: "pending",
      shipping_address: data.shipping_address,
      totalPrice,
      products: data.products,
      user_id: data.user_id,
      created_at,
    };
  }

  static async findUserOrders(userId: string) {
    const result = await orderCollection
      .find({ user_id: userId })
      .project({ status: 1, totoalPrice: 1 })
      .toArray();
    return result;
  }

  static async findById(_id: string): Promise<Types.Order> {
    if (!ObjectId.isValid(_id)) throw new Error("order id is invalid");
    const result = await orderCollection.findOne({ _id: new ObjectId(_id) });
    if (!result) throw new Error("no order found");
    return {
      _id: result.insertedId.toString(),
      status: result.status,
      shipping_address: result.shipping_address,
      totalPrice: result.totalPrice,
      products: result.products,
      user_id: result.user_id,
      created_at: result.created_at,
      canceled_at: result.canceled_at,
      completed_at: result.completed_at,
      confirmed_at: result.confirmed_at,
    };
  }

  static async delete(_id: string) {
    if (!ObjectId.isValid(_id)) throw new Error("order id is invalid");
    const result = await orderCollection.deleteOne({ _id: new ObjectId(_id) });
    if (result.deletedCount === 0) {
      throw new Error("order no longer exists");
    }
  }

  static async updateItems(
    _id: string,
    items: { product: string; count: number }[],
  ) {
    if (!ObjectId.isValid(_id)) throw new Error("order id is invalid");
    const result = await orderCollection.updateOne(
      { _id: new ObjectId(_id), status: "pending" },
      { $set: { items } },
    );
    if (result.matchedCount === 0) {
      const findOrderById = await orderCollection.findOne({
        _id: new ObjectId(_id),
      });
      if (!findOrderById) {
        throw new Error(`order ${_id} not found`);
      } else {
        throw new Error(`order ${_id} status is not pending`);
      }
    }
  }

  static async cancel(_id: string) {
    if (!ObjectId.isValid(_id)) throw new Error("order id is invalid");
    const canceledOrder = await orderCollection.updateOne(
      { _id: new ObjectId(_id) },
      { $set: { status: "canceled", canceled_at: Date.now() } },
    );
    if (canceledOrder.modifiedCount !== 1)
      throw new Error("no order found to cancel");
  }

  static async confirm(_id: string) {
    if (!ObjectId.isValid(_id)) throw new Error("order id is invalid");
    const confirmedOrder = await orderCollection.updateOne(
      { _id: new ObjectId(_id) },
      { $set: { status: "confirmed", confirmed_at: Date.now() } },
    );
    if (confirmedOrder.modifiedCount !== 1)
      throw new Error("no order found to confirm");
  }

  static async complete(_id: string) {
    if (!ObjectId.isValid(_id)) throw new Error("order id is invalid");
    const completedOrder = await orderCollection.updateOne(
      { _id: new ObjectId(_id) },
      { $set: { status: "completed", completed_at: Date.now() } },
    );
    if (completedOrder.modifiedCount !== 1)
      throw new Error("no order found to complete");
  }
}
