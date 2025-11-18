import { ObjectId } from "mongodb";
import { paymentCollection } from "@db/schemas/payment.schema.ts";
import { PaymentService } from "@features/payments/payment.service.ts";

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

describe("PaymentService - integrationTest", () => {
  it("should create a payment", async () => {
    const payment = await PaymentService.create({
      user_id: "2",
      order_id: "3",
      amount: 1200,
    });
    const findPayment = await paymentCollection.findOne({
      _id: new ObjectId(payment._id),
    });
    expect(findPayment?._id).toBeDefined();
  });

  it("should change status to sucess", async () => {
    const paymentUpdate = await PaymentService.success(testID);
    expect(paymentUpdate.modifiedCount).toEqual(1);
  });

  it("should change status to fail", async () => {
    const paymentUpdate = await PaymentService.fail(testID);
    expect(paymentUpdate.modifiedCount).toEqual(1);
  });

  it("should throw when updating non-existent payment", async () => {
    await expect(
      PaymentService.success("507f1f77bcf86cd799439011"),
    ).rejects.toThrow("product no longer exist");
    await expect(
      PaymentService.fail("507f1f77bcf86cd799439011"),
    ).rejects.toThrow("product no longer exist");
  });
});
