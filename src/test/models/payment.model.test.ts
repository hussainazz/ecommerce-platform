import { ObjectId } from "mongodb";
import { paymentCollection } from "@db/schemas/payment.schema.ts";
import { PaymentClass } from "@features/payments/payment.model.ts";

let testID: string;

beforeAll(async () => {
  await paymentCollection.deleteMany({});
  const testPayment = await paymentCollection.insertOne({
    user_id: "test",
    order_id: "test",
    status: "pending",
    amount: 1200,
  });
  testID = testPayment.insertedId.toString();
});

afterAll(async () => {
  await paymentCollection.deleteMany({});
});

describe("PaymentClass - integrationTest", () => {
  it("should create a payment and be instance of payment class", async () => {
    const payment = await PaymentClass.create({
      user_id: "2",
      order_id: "3",
      amount: 1200,
    });
    const findPayment = await paymentCollection.findOne({
      _id: new ObjectId(payment._id),
    });
    expect(findPayment?._id).toBeDefined();
    expect(payment).toBeInstanceOf(PaymentClass);
  });

  it("should change status to sucess", async () => {
    const paymentUpdate = await PaymentClass.success(testID);
    expect(paymentUpdate.modifiedCount).toEqual(1);
  });

  it("should change status to fail", async () => {
    const paymentUpdate = await PaymentClass.fail(testID);
    expect(paymentUpdate.modifiedCount).toEqual(1);
  });

  it("should throw when updating non-existent payment", async () => {
    await expect(
      PaymentClass.success("507f1f77bcf86cd799439011"),
    ).rejects.toThrow("product no longer exist");
    await expect(PaymentClass.fail("507f1f77bcf86cd799439011")).rejects.toThrow(
      "product no longer exist",
    );
  });
});
