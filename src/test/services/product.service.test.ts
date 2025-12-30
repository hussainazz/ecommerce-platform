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
    await expect(ProductService.findById(randomId)).rejects.toThrow(
      `no product was found`,
    );
  });

  it("should throw when deleting non-existing product", async () => {
    const randomId = new ObjectId().toString();
    await expect(ProductService.delete(randomId)).rejects.toThrow(
      `no product was found to delete`,
    );
  });

  it("should delete the product", async () => {
    const productId = await createTestProduct();
    const result = await ProductService.delete(productId);
    expect(result.deletedCount).toEqual(1);
  });

  // Stock Management Tests
  describe("Stock Management", () => {
    it("should decrease stock correctly", async () => {
      const productId = await createTestProduct(); // stock: 100
      await ProductService.decreaseStock(productId, 30);
      const product = await ProductService.findById(productId);
      expect(product?.stock).toEqual(70);
    });

    it("should decrease stock to zero", async () => {
      const productId = await createTestProduct(); // stock: 100
      await ProductService.decreaseStock(productId, 100);
      const product = await ProductService.findById(productId);
      expect(product?.stock).toEqual(0);
    });

    it("should prevent negative stock values", async () => {
      const productId = await createTestProduct(); // stock: 100
      await expect(
        ProductService.decreaseStock(productId, 101),
      ).rejects.toThrow(`product ${productId} is out of stock`);

      // Verify stock remains unchanged
      const product = await ProductService.findById(productId);
      expect(product?.stock).toEqual(100);
    });

    it("should throw when decreasing stock of non-existing product", async () => {
      const randomId = new ObjectId().toString();
      await expect(ProductService.decreaseStock(randomId, 10)).rejects.toThrow(
        `product ${randomId} not exists`,
      );
    });

    it("should increase stock correctly", async () => {
      const productId = await createTestProduct(); // stock: 100
      await ProductService.increaseStock(productId, 50);
      const product = await ProductService.findById(productId);
      expect(product?.stock).toEqual(150);
    });

    it("should increase stock from zero", async () => {
      const productId = await createTestProduct(); // stock: 100
      // First decrease to zero
      await ProductService.decreaseStock(productId, 100);
      // Then increase
      await ProductService.increaseStock(productId, 25);
      const product = await ProductService.findById(productId);
      expect(product?.stock).toEqual(25);
    });

    it("should throw when increasing stock of non-existing product", async () => {
      const randomId = new ObjectId().toString();
      await expect(ProductService.increaseStock(randomId, 10)).rejects.toThrow(
        `product ${randomId} not exists`,
      );
    });

    it("should handle ObjectId type for stock operations", async () => {
      const productId = await createTestProduct(); // stock: 100
      const objectId = new ObjectId(productId);

      await ProductService.decreaseStock(objectId, 10);
      let product = await ProductService.findById(productId);
      expect(product?.stock).toEqual(90);

      await ProductService.increaseStock(objectId, 20);
      product = await ProductService.findById(productId);
      expect(product?.stock).toEqual(110);
    });
  });
});
