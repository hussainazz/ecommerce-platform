import { orderCollection } from "@db/schemas/order.schema.ts";
import { OrderService } from "@features/orders/order.service.ts";
import { ObjectId } from "mongodb";
import { productCollection } from "@db/schemas/product.schema.ts";
let testID: string;

beforeAll(async () => {
  await orderCollection.deleteMany({});
  const testProduct = await productCollection.insertOne({
    title: "titleTest",
    price: 10000,
    category: "test category",
    stock: 100,
    description: "a test doc",
  });
  try {
    const testOrder = await orderCollection.insertOne({
      status: "pending",
      shipping_addres: {
        street: "street - 1",
        city: "tehran",
        province: "tehran",
        postCode: 3542024802,
      },
      totalPrice: 1203030,
      product: {
        product_id: testProduct.insertedId.toString(),
        count: 2,
      },
      user_id: "test",
    });
    testID = testOrder.insertedId.toString();
  } catch (error: any) {
    if (error.errInfo) {
      console.error(
        "Validation Error Details:",
        JSON.stringify(error.errInfo.details),
      );
    }
  }
});

afterAll(async () => {
  await orderCollection.deleteMany({});
});

describe("OrderService - integrationTest", async () => {
  const testProduct_0 = await productCollection.insertOne({
    title: "test0",
    price: 20000,
    category: "test category",
    stock: 5,
    description: "a test doc",
  });
  const testProduct_1 = await productCollection.insertOne({
    title: "test1",
    price: 10000,
    category: "test category",
    stock: 5,
    description: "a test doc",
  });

  it("should create new order and decrease product stock", async () => {
    const order = await OrderService.create({
      shipping_address: {
        street: "street 1001",
        city: "karaj",
        province: "alborz",
        postCode: 2000000000,
      },
      products: [
        {
          product_id: testProduct_0.insertedId.toString(),
          count: 3,
        },
        {
          product_id: testProduct_1.insertedId.toString(),
          count: 3,
        },
      ],
      user_id: "test",
    });
    const findOrder = await orderCollection.findOne({
      _id: new ObjectId(order._id),
    });
    const findProduct = await productCollection.findOne({
      _id: testProduct_0.insertedId,
    });
    expect(findOrder?._id).toBeDefined();
    expect(findProduct?.stock).toEqual(2);
  });

  it("should not add product when out of stock", async () => {
    try {
      await OrderService.create({
        shipping_address: {
          street: "street 1001",
          city: "karaj",
          province: "alborz",
          postCode: 2000000000,
        },
        products: [
          {
            product_id: testProduct_0.insertedId.toString(),
            count: 10,
          },
        ],
        user_id: "test",
      });
    } catch (e: any) {
      expect(e.message).toContain("out of stock");
    }
  });

  it("should not add order containing non-existent product id", async () => {
    try {
      await OrderService.create({
        shipping_address: {
          street: "street 1001",
          city: "karaj",
          province: "alborz",
          postCode: 2000000000,
        },
        products: [
          {
            product_id: "507f1f77bcf86cd799439013",
            count: 10,
          },
        ],
        user_id: "test",
      });
    } catch (e: any) {
      expect(e.message).toContain("product id not exist");
    }
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
