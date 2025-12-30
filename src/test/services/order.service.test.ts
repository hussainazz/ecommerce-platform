import { orderCollection } from "@db/schemas/order.schema.ts";
import { OrderService } from "@features/orders/order.service.ts";
import { ObjectId } from "mongodb";
import { productCollection } from "@db/schemas/product.schema.ts";
import { v4 as uuidv4 } from "uuid";

// Helper to create a test product
async function createTestProduct(
  overrides: {
    title?: string;
    price?: number;
    stock?: number;
  } = {},
) {
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
async function createTestOrder(
  overrides: {
    status?: string;
    products?: { product_id: ObjectId; count: number }[];
  } = {},
) {
  // If no products provided, create a dummy one
  let products = overrides.products;
  if (!products) {
    const prod = await createTestProduct();
    products = [{ product_id: prod._id, count: 1 }];
  }

  // Note: user_id is not validated by OrderService (no user existence check)
  // Using a static ObjectId is safe here since it's just stored, not looked up
  const orderDoc = {
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
  };

  const result = await orderCollection.insertOne(orderDoc);
  return { ...orderDoc, _id: result.insertedId };
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
    const prod1 = await createTestProduct({
      title: "testss0",
      price: 20000,
      stock: 5,
    });
    const prod2 = await createTestProduct({
      title: "test1",
      price: 20000,
      stock: 5,
    });

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

  it("should not add order when out of stock", async () => {
    const prod = await createTestProduct({ stock: 5 });
    const findProduct = await productCollection.findOne({
      _id: prod._id,
    });
    await expect(
      OrderService.create({
        shipping_address: {
          street: "street 1001",
          city: "karaj",
          province: "alborz",
          postCode: 2000000000,
        },
        products: [{ product_id: prod._id, count: 10 }],
        user_id: "507f1f77bcf86cd799439013",
      }),
    ).rejects.toThrow("out of stock");
  });

  it("should not add order containing non-existent product id", async () => {
    await expect(
      OrderService.create({
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
      }),
    ).rejects.toThrow("product id not exist");
  });

  it("should assign `cancel` to status", async () => {
    const order = await createTestOrder();
    const orderId = order._id.toString();
    await OrderService.cancel(orderId);

    const modifiedOrder = await orderCollection.findOne({
      _id: new ObjectId(orderId),
    });
    expect(modifiedOrder!.status).toEqual("canceled");
    expect(modifiedOrder!.canceled_at).toBeDefined();
  });

  it("should decrease product stock after new order", async () => {
    const product = await createTestProduct();
    const order = await OrderService.create({
      shipping_address: {
        street: "street 1001",
        city: "karaj",
        province: "alborz",
        postCode: 2000000000,
      },
      products: [
        {
          product_id: product._id,
          count: 10,
        },
      ],
      user_id: "507f1f77bcf86cd799439313",
    });
    const modifiedProduct = await productCollection.findOne({
      _id: new ObjectId(order.products[0]?.product_id.toString()),
    });
    // the default stock is 100
    expect(modifiedProduct!.stock).toEqual(90);
  });

  it("should assign `completed` to status", async () => {
    const order = await createTestOrder();
    const orderId = order._id.toString();
    await OrderService.complete(orderId);

    const modifiedOrder = await orderCollection.findOne({
      _id: new ObjectId(orderId),
    });
    expect(modifiedOrder!.status).toEqual("completed");
    expect(modifiedOrder!.completed_at).toBeDefined();
  });

  it("should assign `confirmed` to status", async () => {
    const order = await createTestOrder();
    const orderId = order._id.toString();
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
    await expect(OrderService.complete(fakeId)).rejects.toThrow(
      "no order found to complete",
    );
    // confirm order
    await expect(OrderService.confirm(fakeId)).rejects.toThrow(
      "no order found to confirm",
    );
    // cancel order
    await expect(OrderService.cancel(fakeId)).rejects.toThrow(
      "no order found to cancel",
    );
  });

  it("should restore product stock when order is canceled", async () => {
    const prod = await createTestProduct({ stock: 10 });

    // Stock should now be 7 (10 - 3)
    const order = await OrderService.create({
      shipping_address: {
        street: "street 1001",
        city: "karaj",
        province: "alborz",
        postCode: 2000000000,
      },
      products: [{ product_id: prod._id.toString(), count: 3 }],
      user_id: "507f1f77bcf86cd799439013",
    });

    await OrderService.cancel(order._id!);
    const updatedProduct = await productCollection.findOne({ _id: prod._id });

    // Stock should be restored to original
    expect(updatedProduct?.stock).toEqual(10);
  });

  it("should restore product stock when order is deleted", async () => {
    const prod = await createTestProduct({ stock: 15 });
    //Stock should now be 10 (15 - 5)
    const order = await OrderService.create({
      shipping_address: {
        street: "street 1001",
        city: "karaj",
        province: "alborz",
        postCode: 2000000000,
      },
      products: [{ product_id: prod._id.toString(), count: 5 }],
      user_id: "507f1f77bcf86cd799439013",
    });

    await OrderService.delete(order._id!);

    const updatedProduct = await productCollection.findOne({ _id: prod._id });
    // Stock should be restored to original
    expect(updatedProduct?.stock).toEqual(15);
  });

  it("should correctly update product stocks when order items are modified", async () => {
    const prod1 = await createTestProduct({ stock: 20 });
    const prod2 = await createTestProduct({ stock: 10 });
    const prod3 = await createTestProduct({ stock: 5 });

    // Create order using OrderService.create to properly decrease stock
    const order = await OrderService.create({
      shipping_address: {
        street: "street 1001",
        city: "karaj",
        province: "alborz",
        postCode: 2000000000,
      },
      products: [
        { product_id: prod1._id.toString(), count: 5 },
        { product_id: prod2._id.toString(), count: 3 },
        { product_id: prod3._id.toString(), count: 2 },
      ],
      user_id: "507f1f77bcf86cd799439013",
    });

    // Current stocks: prod1=15, prod2=7, prod3=3
    // Update items: increase prod1, decrease prod2, remove prod3, add new prod4
    const prod4 = await createTestProduct({ stock: 8 });
    await OrderService.updateItems(order._id!, [
      { product_id: prod1._id.toString(), count: 8 }, // increase by 3
      { product_id: prod2._id.toString(), count: 1 }, // decrease by 2
      { product_id: prod4._id.toString(), count: 4 }, // new item
    ]);

    const updatedProd1 = await productCollection.findOne({ _id: prod1._id });
    const updatedProd2 = await productCollection.findOne({ _id: prod2._id });
    const updatedProd3 = await productCollection.findOne({ _id: prod3._id });
    const updatedProd4 = await productCollection.findOne({ _id: prod4._id });

    expect(updatedProd1?.stock).toEqual(12); // 15 - 3 = 12 (20 - 8 total)
    expect(updatedProd2?.stock).toEqual(9); // 7 + 2 = 9 (10 - 1 total)
    expect(updatedProd3?.stock).toEqual(5); // 3 + 2 (restored) = 5
    expect(updatedProd4?.stock).toEqual(4); // 8 - 4 = 4
  });
});
