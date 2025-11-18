import { productCollection } from "@db/schemas/product.schema.ts";
import { ProductClass } from "@features/products/product.model.ts";

let testID: any;

beforeAll(async () => {
  await productCollection.deleteMany({});
  const testProduct = await productCollection.insertOne({
    title: "test title",
    price: 10000,
    category: "test category",
    inventory: 100,
    description: "a test doc",
  });
  testID = testProduct.insertedId.toString();
});

afterAll(async () => {
  await productCollection.deleteMany({});
});

describe("ProductClass - integrationTest", () => {
  it("Should create a product and return instance of ProductClass", async () => {
    const product = await ProductClass.create({
      title: "plastic car",
      price: 100000,
      category: "toy",
      inventory: 1000,
      description: "a car toy made for kids older than 3",
    });
    const createdProduct = await productCollection.findOne({
      title: product.title,
    });
    expect(createdProduct!._id).toBeDefined();
    expect(product).toBeInstanceOf(ProductClass);
  });

  it("should find the product document", async () => {
    const product = await ProductClass.findById(testID);
    expect(product).toBeInstanceOf(ProductClass);
  });

  it("should throw when finding non-existing product", async () => {
    await expect(
      ProductClass.findById("507f1f77bcf86cd799439011"),
    ).rejects.toThrow(`no product was found`);
  });

  it("should delete the product document", async () => {
    const product = await ProductClass.delete(testID);
    expect(product.deletedCount).toEqual(1);
  });

  it("should throw when deleting non-existing product", async () => {
    await expect(
      ProductClass.delete("507f1f77bcf86cd799439011"),
    ).rejects.toThrow(`no product was found to delete`);
  });
});
