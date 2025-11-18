import { ObjectId } from "mongodb";
import { orderCollection } from "@db/schemas/order.schema.ts";

export class OrderClass {
  constructor(
    public status: "completed" | "confirmed" | "pending" | "canceled",
    public shipping_address: {
      street: string;
      city: string;
      province: string;
      postCode: number;
    },
    public totalPrice: number,
    public products: {
      product_id: string;
      count: number;
    }[],
    public user_id: string,
    public _id?: string,
    public created_at?: number,
    public canceled_at?: number,
    public completed_at?: number,
    public confirmed_at?: number,
  ) {}

  static async create(
    data: Omit<
      OrderClass,
      | "_id"
      | "status"
      | "created_at"
      | "constructor"
      | "confirmed_at"
      | "canceled_at"
      | "completed_at"
    >,
  ): Promise<OrderClass> {
    let created_at = Date.now();
    const result = await orderCollection.insertOne({
      ...data,
      created_at,
    });
    return new OrderClass(
      "pending",
      data.shipping_address,
      data.totalPrice,
      data.products,
      data.user_id,
      result.insertedId.toString(),
    );
  }

  static async findById(_id: string) {
    if (!ObjectId.isValid(_id)) throw new Error("order id is invalid");
    const result = await orderCollection.findOne({ _id: new ObjectId(_id) });
    if (!result) throw new Error("no order found");
    return new OrderClass(
      result.status,
      result.shipping_address,
      result.totalPrice,
      result.products,
      result.user_id,
      result.insertedId.toString(),
      result.created_at,
      result.canceled_at,
      result.completed_at,
      result.confirmed_at,
    );
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
