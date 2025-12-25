import { productCollection } from "@db/schemas/product.schema.ts";
import { ProductService } from "@features/products/product.service.ts";
import { v4 as uuidv4 } from "uuid";
import { ObjectId } from "mongodb";

// Helper
async function createTestProduct() {
  const result = await productCollection.insertOne({
    title: `test title ${uuidv4()}`,
    price: 10000,
    category: "test category",
    stock: 100,
    description: "a test doc",
  });
  return result.insertedId.toString();
}

describe("ProductService - integrationTest", () => {
  beforeEach(async () => {
    await productCollection.deleteMany({});
  });

  afterAll(async () => {
    await productCollection.deleteMany({});
  });

  it("Should create a product", async () => {
    const product = await ProductService.create({
      title: "plastic car",
      price: 100000,
      category: "toy",
      stock: 1000,
      description: "a car toy made for kids older than 3",
    });
    const createdProduct = await productCollection.findOne({
      title: product.title,
    });
    expect(createdProduct?._id).toBeDefined();
  });

  it("should find the product", async () => {
    const productId = await createTestProduct();
    const product = await ProductService.findById(productId);
    expect(product?._id).toBeDefined();
  });

  it("should throw when finding non-existing product", async () => {
    const randomId = new ObjectId().toString();
    await expect(
      ProductService.findById(randomId),
    ).rejects.toThrow(`no product was found`);
  });

  it("should throw when deleting non-existing product", async () => {
    const randomId = new ObjectId().toString();
    await expect(
      ProductService.delete(randomId),
    ).rejects.toThrow(`no product was found to delete`);
  });

  it("should delete the product", async () => {
    const productId = await createTestProduct();
    const result = await ProductService.delete(productId);
    expect(result.deletedCount).toEqual(1);
  });
});
