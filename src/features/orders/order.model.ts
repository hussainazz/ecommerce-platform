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
    public items: string[],
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
      | "created_at"
      | "constructor"
      | "confirmed_at"
      | "canceled_at"
      | "completed_at"
    >,
  ): Promise<OrderClass> {
    const result = await orderCollection.insertOne({
      ...data,
      created_at: Date.now(),
    });
    return new OrderClass(
      data.status,
      data.shipping_address,
      data.totalPrice,
      data.products,
      data.user_id,
      data.items,
      result.insertedId.toString(),
    );
  }

  static async cancel(_id: string) {
    if (!ObjectId.isValid(_id)) throw new Error("order id is invalid");
    await orderCollection.updateOne(
      { _id: new ObjectId(_id) },
      { $set: { status: "canceled", canceled_at: Date.now() } },
    );
  }

  static async confirm(_id: string) {
    if (!ObjectId.isValid(_id)) throw new Error("order id is invalid");
    await orderCollection.updateOne(
      { _id: new ObjectId(_id) },
      { $set: { status: "confirmed", confirmed_at: Date.now() } },
    );
  }

  static async complete(_id: string) {
    if (!ObjectId.isValid(_id)) throw new Error("order id is invalid");
    await orderCollection.updateOne(
      { _id: new ObjectId(_id) },
      { $set: { status: "completed", completed_at: Date.now() } },
    );
  }
}
