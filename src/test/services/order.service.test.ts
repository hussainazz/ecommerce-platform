import { orderCollection } from "@db/schemas/order.schema.ts";
import { OrderService } from "@features/orders/order.service.ts";
import { ObjectId } from "mongodb";

let testID: string;

beforeAll(async () => {
  await orderCollection.deleteMany({});
  const testOrder = await orderCollection.insertOne({
    status: "pending",
    shipping_addres: {
      street: "street - 1",
      city: "tehran",
      province: "tehran",
      postCode: 3542024802,
    },
    totalPrice: 10000,
    product: {
      product_id: "test",
      count: 2,
    },
    user_id: "test",
  });
  testID = testOrder.insertedId.toString();
});

afterAll(async () => {
  await orderCollection.deleteMany({});
});

describe("OrderService - integrationTest", () => {
  it("should create new order", async () => {
    const order = await OrderService.create({
      shipping_address: {
        street: "street 1001",
        city: "karaj",
        province: "alborz",
        postCode: 2,
      },
      totalPrice: 20000,
      products: [
        {
          product_id: "test",
          count: 10,
        },
      ],
      user_id: "test",
    });
    const _id = new ObjectId(order._id);
    const findOrder = await orderCollection.findOne({ _id });
    expect(findOrder?._id).toBeDefined();
  });

  it("should assign `cancel` to status", async () => {
    await OrderService.cancel(testID);
    const modifiedOrder = await orderCollection.findOne({
      _id: new ObjectId(testID),
    });
    expect(modifiedOrder!.status).toEqual("canceled");
    expect(modifiedOrder!.canceled_at).toBeDefined();
  });

  it("should assign `completed` to status", async () => {
    await OrderService.complete(testID);
    const modifiedOrder = await orderCollection.findOne({
      _id: new ObjectId(testID),
    });
    expect(modifiedOrder!.status).toEqual("completed");
    expect(modifiedOrder!.completed_at).toBeDefined();
  });

  it("should assign `confirmed` to status", async () => {
    await OrderService.confirm(testID);
    const modifiedOrder = await orderCollection.findOne({
      _id: new ObjectId(testID),
    });
    expect(modifiedOrder!.status).toEqual("confirmed");
    expect(modifiedOrder!.confirmed_at).toBeDefined();
  });

  it("should throw when finding non-existing order", async () => {
    await expect(
      OrderService.findById("507f1f77bcf86cd799439011"),
    ).rejects.toThrow("no order found");
  });

  it("should throw when updating non-existing order", async () => {
    // compelete order
    await expect(
      OrderService.complete("507f1f77bcf86cd799439011"),
    ).rejects.toThrow("no order found to complete");
    // confirm order
    await expect(
      OrderService.confirm("507f1f77bcf86cd799439011"),
    ).rejects.toThrow("no order found to confirm");
    // cancel order
    await expect(
      OrderService.cancel("507f1f77bcf86cd799439011"),
    ).rejects.toThrow("no order found to cancel");
  });
});
