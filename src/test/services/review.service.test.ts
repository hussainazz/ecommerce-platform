import { productCollection } from "@db/schemas/product.schema.ts";
import { reviewCollection } from "@db/schemas/review.schema.ts";
import { ReviewService } from "@features/reviews/review.service.ts";
import { ObjectId } from "mongodb";
import { v4 as uuidv4 } from "uuid";

// Helpers
async function createTestProduct(overrides: { stock?: number } = {}) {
  const result = await productCollection.insertOne({
    title: `Test Product ${uuidv4()}`,
    price: 100,
    category: "test",
    stock: overrides.stock ?? 10,
  });
  return result.insertedId.toString();
}

async function createTestReview(productId: string, userId: string) {
  await ReviewService.add({
    product_id: productId,
    user_id: userId,
    rate: 5,
    comment: "Great product!",
  });
}

// Hardcoded user IDs are acceptable here because:
// - ReviewService only validates ObjectId format, not user existence in DB
// - These are valid ObjectId strings that pass validation
// - No foreign key constraint checks against userCollection
const testUser1 = "64bfa4d2e3c2a1f8b4d6c9e2";

const newReview1 = {
  rate: 2 as 2,
  comment: "test text",
};

const newReview2 = {
  rate: 4 as 4,
  comment: "test second text",
};

describe("ReviewService - integrationTest", () => {
  beforeEach(async () => {
    await reviewCollection.deleteMany({});
    await productCollection.deleteMany({});
  });

  afterAll(async () => {
    await reviewCollection.deleteMany({});
    await productCollection.deleteMany({});
  });

  it("should add reviews", async () => {
    const productId = await createTestProduct();
    const instertedReview = await ReviewService.add({
      product_id: productId,
      user_id: testUser1,
      rate: newReview1.rate,
      comment: newReview1.comment,
    });

    const addedReview = await reviewCollection.findOne({
      product_id: new ObjectId(productId),
      user_id: new ObjectId(testUser1),
    });
    expect(addedReview?._id.toString()).toEqual(instertedReview._id);
  });

  it("should throw when one user adds multiple reviews", async () => {
    const productId = await createTestProduct();

    // Add first review
    await ReviewService.add({
      product_id: productId,
      user_id: testUser1,
      rate: newReview1.rate,
      comment: newReview1.comment,
    });

    // Try adding second review
    await expect(
      ReviewService.add({
        product_id: productId,
        user_id: testUser1,
        rate: newReview2.rate,
        comment: newReview2.comment,
      }),
    ).rejects.toThrow("one user can't add multiple reviews for one product");
  });

  it("should throw when review adding for non-existent product", async () => {
    const nonExistProdID = new ObjectId().toString();
    await expect(
      ReviewService.add({
        product_id: nonExistProdID,
        user_id: testUser1,
        rate: newReview1.rate,
        comment: newReview1.comment,
      }),
    ).rejects.toThrow("product no longer exist");
  });

  it("should throw adding review for sold out product", async () => {
    const noStockProdID = await createTestProduct({ stock: 0 });
    await expect(
      ReviewService.add({
        product_id: noStockProdID,
        user_id: testUser1,
        rate: newReview1.rate,
        comment: newReview1.comment,
      }),
    ).rejects.toThrow("product is sold out");
  });

  it("should throw when a user tries to delete another user's review", async () => {
    const productId = await createTestProduct();
    const user1Id = new ObjectId().toString();
    const user2Id = new ObjectId().toString();

    await ReviewService.add({
      product_id: productId,
      user_id: user1Id,
      rate: 3,
      comment: "Review by user 1",
    });

    const user1Review = await reviewCollection.findOne({
      user_id: new ObjectId(user1Id),
    });

    await expect(
      ReviewService.delete(user1Review._id.toString(), user2Id),
    ).rejects.toThrow("review no longer exist");
  });
});
