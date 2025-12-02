import { Long, ObjectId } from "mongodb";
import { paymentCollection } from "@db/schemas/payment.schema.ts";
import { PaymentService } from "@features/payments/payment.service.ts";
import { orderCollection } from "@db/schemas/order.schema.ts";
import { productCollection } from "@db/schemas/product.schema.ts";

let testID: string;

beforeAll(async () => {
  await paymentCollection.deleteMany({});
  const testPayment = await paymentCollection.insertOne({
    user_id: new ObjectId("507f1f77bcf86cd799439011"),
    order_id: new ObjectId("507f1f77bcf86cd799439011"),
    status: "pending",
    amount: new Long(1200),
    created_at: new Date(),
  });
  testID = testPayment.insertedId.toString();
});

afterAll(async () => {
  await paymentCollection.deleteMany({});
});

describe("PaymentService - integrationTest", async () => {
  const testProduct = await productCollection.insertOne({
    title: "titleTest",
    price: new Long(10000),
    category: "test category",
    stock: 100,
    description: "a test doc",
  });
  const testOrder = await orderCollection.insertOne({
    status: "pending",
    shipping_address: {
      street: "street - 1",
      city: "tehran",
      province: "tehran",
      postCode: new Long(3000000000),
    },
    totalPrice: new Long(1203030),
    products: [{ product_id: testProduct.insertedId, count: 2 }],
    user_id: new ObjectId("507f1f77bcf86cd799439013"),
  });
  it("should create a payment", async () => {
    const payment = await PaymentService.create({
      user_id: "507f1f77bcf8acd790439010",
      order_id: testOrder.insertedId.toString(),
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
