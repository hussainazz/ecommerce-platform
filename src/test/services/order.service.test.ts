import { orderCollection } from "@db/schemas/order.schema.ts";
import { OrderService } from "@features/orders/order.service.ts";
import { ObjectId } from "mongodb";
import { productCollection } from "@db/schemas/product.schema.ts";
import { v4 as uuidv4 } from "uuid";

// Helper to create a test product
async function createTestProduct(overrides: {
  title?: string;
  price?: number;
  stock?: number;
} = {}) {
  const result = await productCollection.insertOne({
    title: overrides.title || `Product ${uuidv4()}`,
    price: overrides.price ?? 10000,
    category: "test category",
    stock: overrides.stock ?? 100,
    description: "a test doc",
  });
  return { ...overrides, _id: result.insertedId };
}

// Helper to create a test order
async function createTestOrder(overrides: {
  status?: string;
  products?: { product_id: ObjectId; count: number }[];
} = {}) {
  // If no products provided, create a dummy one
  let products = overrides.products;
  if (!products) {
    const prod = await createTestProduct();
    products = [{ product_id: prod._id, count: 1 }];
  }

  const result = await orderCollection.insertOne({
    status: overrides.status || "pending",
    shipping_address: {
      street: "street - 1",
      city: "tehran",
      province: "tehran",
      postCode: 3000000000,
    },
    totalPrice: 1203030,
    products: products,
    user_id: new ObjectId("507f1f77bcf86cd799439013"),
  });
  return result.insertedId.toString();
}

describe("OrderService - integrationTest", () => {
  beforeEach(async () => {
    await orderCollection.deleteMany({});
    await productCollection.deleteMany({});
  });

  afterAll(async () => {
    await orderCollection.deleteMany({});
    await productCollection.deleteMany({});
  });

  it("should create new order and decrease product stock", async () => {
    const prod1 = await createTestProduct({ title: "testss0", price: 20000, stock: 5 });
    const prod2 = await createTestProduct({ title: "test1", price: 20000, stock: 5 });

    const order = await OrderService.create({
      shipping_address: {
        street: "street 1001",
        city: "karaj",
        province: "alborz",
        postCode: 2000000000,
      },
      products: [
        { product_id: prod1._id, count: 3 },
        { product_id: prod2._id, count: 3 },
      ],
      user_id: "507f1f77bcf86cd799439013",
    });

    const findOrder = await orderCollection.findOne({
      _id: new ObjectId(order._id),
    });
    const findProduct = await productCollection.findOne({
      _id: prod1._id,
    });

    expect(findOrder).toBeDefined();
    expect(findProduct?.stock).toEqual(2); // 5 - 3 = 2
  });

  it("should not add product when out of stock", async () => {
    const prod = await createTestProduct({ stock: 5 });
    await expect(OrderService.create({
      shipping_address: {
        street: "street 1001",
        city: "karaj",
        province: "alborz",
        postCode: 2000000000,
      },
      products: [
        { product_id: prod._id, count: 10 },
      ],
      user_id: "507f1f77bcf86cd799439013",
    })).rejects.toThrow("out of stock");
  });

  it("should not add order containing non-existent product id", async () => {
    await expect(OrderService.create({
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
      user_id: "507f1f77bcf86cd799439013",
    })).rejects.toThrow("product id not exist");
  });

  it("should assign `cancel` to status", async () => {
    const orderId = await createTestOrder();
    await OrderService.cancel(orderId);

    const modifiedOrder = await orderCollection.findOne({
      _id: new ObjectId(orderId),
    });
    expect(modifiedOrder!.status).toEqual("canceled");
    expect(modifiedOrder!.canceled_at).toBeDefined();
  });

  it("should assign `completed` to status", async () => {
    const orderId = await createTestOrder();
    await OrderService.complete(orderId);

    const modifiedOrder = await orderCollection.findOne({
      _id: new ObjectId(orderId),
    });
    expect(modifiedOrder!.status).toEqual("completed");
    expect(modifiedOrder!.completed_at).toBeDefined();
  });

  it("should assign `confirmed` to status", async () => {
    const orderId = await createTestOrder();
    await OrderService.confirm(orderId);

    const modifiedOrder = await orderCollection.findOne({
      _id: new ObjectId(orderId),
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
    const fakeId = "507f1f77bcf86cd799439011";
    // complete order
    await expect(
      OrderService.complete(fakeId),
    ).rejects.toThrow("no order found to complete");
    // confirm order
    await expect(
      OrderService.confirm(fakeId),
    ).rejects.toThrow("no order found to confirm");
    // cancel order
    await expect(
      OrderService.cancel(fakeId),
    ).rejects.toThrow("no order found to cancel");
  });
});
