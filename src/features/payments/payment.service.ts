import { ObjectId } from "mongodb";
import { paymentCollection } from "@db/schemas/payment.schema.ts";
import * as Types from "@shared/types/types.ts";
import { orderCollection } from "@db/schemas/order.schema.ts";

export class PaymentService {
  static async create(
    data: Omit<
      Types.Payment,
      "_id" | "status" | "created_at" | "confirmed_at" | "authority"
    >,
  ): Promise<Omit<Types.Payment, "authority">> {
    const created_at = new Date();
    if (!ObjectId.isValid(data.order_id))
      throw new Error("order id is invalid");
    const actulOrderAmount = await orderCollection.findOne(
      {
        _id: new ObjectId(data.order_id),
      },
      { projection: { totalPrice: 1 } },
    );
    if (!actulOrderAmount) {
      throw new Error("order doesn't exist");
    }
    if (actulOrderAmount.totalPrice != data.amount) {
      throw new Error("order price and passed amount don't match");
    }
    const result = await paymentCollection.insertOne({
      ...data,
      user_id: new ObjectId(data.user_id),
      order_id: new ObjectId(data.order_id),
      amount: actulOrderAmount.totalPrice,
      authority: null,
      status: "pending",
      created_at,
    });
    return {
      _id: result.insertedId.toString(),
      user_id: data.user_id,
      order_id: data.order_id,
      status: "pending",
      amount: actulOrderAmount.totalPrice,
      created_at,
    };
  }

  static async addAuthority(_id: string, authority: string) {
    if (!authority) {
      throw new Error("authority must be provided");
    }
    const result = await paymentCollection.updateOne(
      { _id: new ObjectId(_id), status: "pending" },
      { $set: { authority } },
    );
    if (result.matchedCount !== 1) {
      throw new Error("can't update the payment");
    }
  }
  static async success(authority: string) {
    const result = await paymentCollection.updateOne(
      { authority },
      { $set: { status: "success" } },
    );
    if (result.matchedCount !== 1) {
      throw new Error("product no longer exist");
    }
    return result;
  }

  static async fail(authority: string) {
    const result = await paymentCollection.updateOne(
      { authority },
      { $set: { status: "fail" } },
    );
    if (result.matchedCount !== 1) {
      throw new Error("product no longer exist");
    }
    return result;
  }

  static async findById(_id: string, user_id: string) {
    if (!ObjectId.isValid(_id) || !ObjectId.isValid(_id))
      throw new Error("payment/user id is invalid");
    const result = await paymentCollection.findOne({
      _id: new ObjectId(_id),
      user_id: new ObjectId(user_id),
    });
    return result;
  }
  static async findAll(user_id: string) {
    if (!ObjectId.isValid(user_id)) throw new Error("user id is invalid");
    const result = await paymentCollection.find({
      user_id: new ObjectId(user_id),
    });
    return result;
  }
}
