import { Long, ObjectId } from "mongodb";
import { paymentCollection } from "@db/schemas/payment.schema.ts";
import * as Types from "@shared/types/types.ts";

export class PaymentService {
  static async create(
    data: Omit<Types.Payment, "_id" | "status" | "created_at" | "confirmed_at">,
  ): Promise<Types.Payment> {
    const created_at = new Date();
    const result = await paymentCollection.insertOne({
      ...data,
      user_id: new ObjectId(data.user_id),
      order_id: new ObjectId(data.order_id),
      amount: Long.fromBigInt(data.amount),
      status: "pending",
      created_at,
    });
    return {
      _id: result.insertedId.toString(),
      user_id: data.user_id,
      order_id: data.order_id,
      status: "pending",
      amount: data.amount,
      created_at,
    };
  }

  static async success(_id: string) {
    if (!ObjectId.isValid(_id)) throw new Error("order id is invalid");
    const result = await paymentCollection.updateOne(
      { _id: new ObjectId(_id) },
      { $set: { status: "success" } },
    );
    if (result.matchedCount !== 1) {
      throw new Error("product no longer exist");
    }
    return result;
  }

  static async fail(_id: string) {
    if (!ObjectId.isValid(_id)) throw new Error("order id is invalid");
    const result = await paymentCollection.updateOne(
      { _id: new ObjectId(_id) },
      { $set: { status: "fail" } },
    );
    if (result.matchedCount !== 1) {
      throw new Error("product no longer exist");
    }
    return result;
  }
}
