import { ObjectId } from "mongodb";
import { orderCollection } from "@db/schemas/order.schema.ts";
import * as Types from "@shared/types/types.ts";

export class OrderService {
  static async create(
    data: Omit<
      Types.Order,
      | "_id"
      | "status"
      | "created_at"
      | "confirmed_at"
      | "canceled_at"
      | "completed_at"
    >,
  ): Promise<Types.Order> {
    const created_at = Date.now();
    const result = await orderCollection.insertOne({
      ...data,
      created_at,
    });
    return {
      _id: result.insertedId.toString(),
      status: "pending",
      shipping_address: data.shipping_address,
      totalPrice: data.totalPrice,
      products: data.products,
      user_id: data.user_id,
      created_at,
    };
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
