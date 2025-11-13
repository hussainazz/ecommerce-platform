import { ObjectId } from "mongodb";
import { paymentCollection } from "@db/schemas/payment.schema.ts";

export class PaymentClass {
  constructor(
    public user_id: string,
    public order_id: string,
    public status: "success" | "fail" | "pending",
    public amount: number,
    public _id?: string,
    public created_at?: number,
    public canceled_at?: number,
  ) {}

  static async create(
    data: Omit<PaymentClass, "_id" | "created_at" | "confirmed_at">,
  ): Promise<PaymentClass> {
    const result = await paymentCollection.insertOne({
      ...data,
      created_at: Date.now(),
    });
    return new PaymentClass(
      data.user_id,
      data.order_id,
      data.status,
      data.amount,
      result.insertedId.toString(),
    );
  }

  static async success(_id: string) {
    if (!ObjectId.isValid(_id)) throw new Error("order id is invalid");
    const result = await paymentCollection.updateOne(
      { _id: new ObjectId(_id) },
      { $set: { status: "success" } },
    );
    if (result.matchedCount === 0) {
      throw new Error("product no longer exist");
    }
  }

  static async fail(_id: string) {
    if (!ObjectId.isValid(_id)) throw new Error("order id is invalid");
    await paymentCollection.updateOne(
      { _id: new ObjectId(_id) },
      { status: "fail" },
    );
  }
}
