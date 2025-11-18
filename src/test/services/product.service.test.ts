import { productCollection } from "@db/schemas/product.schema.ts";
import { ProductService } from "@features/products/product.service.ts";

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

describe("ProductService - integrationTest", () => {
  it("Should create a product", async () => {
    const product = await ProductService.create({
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
  });

  it("should find the product", async () => {
    const product = await ProductService.findById(testID);
    expect(product?._id).toBeDefined();
  });

  it("should throw when finding non-existing product", async () => {
    await expect(
      ProductService.findById("507f1f77bcf86cd799439011"),
    ).rejects.toThrow(`no product was found`);
  });

  it("should delete the product document", async () => {
    const product = await ProductService.delete(testID);
    expect(product.deletedCount).toEqual(1);
  });

  it("should throw when deleting non-existing product", async () => {
    await expect(
      ProductService.delete("507f1f77bcf86cd799439011"),
    ).rejects.toThrow(`no product was found to delete`);
  });
});
