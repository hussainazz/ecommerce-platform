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
    description: "a test product",
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
const testUser2 = new ObjectId().toString();
const testUser3 = new ObjectId().toString();
const newReview1 = {
  rate: 2 as 2,
  comment: "test text",
};

const newReview2 = {
  rate: 4 as 4,
  comment: "test second text",
};

const newReview3 = {
  rate: 3 as 3,
  comment: "test third text",
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

  it("should find product's reviews", async () => {
    const productId = await createTestProduct();
    const insertedReview1 = await ReviewService.add({
      product_id: productId,
      user_id: testUser1,
      rate: newReview1.rate,
      comment: newReview1.comment,
    });
    const insertedReview2 = await ReviewService.add({
      product_id: productId,
      user_id: testUser2,
      rate: newReview2.rate,
      comment: newReview2.comment,
    });
    const insertedReview3 = await ReviewService.add({
      product_id: productId,
      user_id: testUser3,
      rate: newReview3.rate,
      comment: newReview3.comment,
    });
    const foundReviews = await ReviewService.findProductReviews(productId);

    console.log(foundReviews);
    expect(foundReviews).toBeDefined();
    expect(Array.isArray(foundReviews)).toBe(true);
    expect(foundReviews).toHaveLength(3);
  });
  ``;
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

  it("should delete a review successfully", async () => {
    const productId = await createTestProduct();
    const userId = new ObjectId().toString();

    await ReviewService.add({
      product_id: productId,
      user_id: userId,
      rate: 4,
      comment: "To be deleted",
    });

    const review = await reviewCollection.findOne({
      user_id: new ObjectId(userId),
    });

    const result = await ReviewService.delete(review._id.toString(), userId);
    expect(result.deletedCount).toEqual(1);

    const deleted = await reviewCollection.findOne({ _id: review._id });
    expect(deleted).toBeNull();
  });

  it("should find review by id", async () => {
    const productId = await createTestProduct();
    const userId = new ObjectId().toString();

    const inserted = await ReviewService.add({
      product_id: productId,
      user_id: userId,
      rate: 5,
      comment: "Find me",
    });

    const found = await ReviewService.findById(inserted._id);
    expect(found).toBeDefined();
    expect(found._id.toString()).toEqual(inserted._id);
  });

  it("should throw when finding review with non-existent id", async () => {
    const randomId = new ObjectId().toString();
    await expect(ReviewService.findById(randomId)).rejects.toThrow(
      `review ${randomId} not exist`,
    );
  });

  it("should throw when finding review with invalid ObjectId", async () => {
    await expect(ReviewService.findById("invalid-id")).rejects.toThrow(
      "review id is invalid",
    );
  });

  it("should throw when adding review with missing rate", async () => {
    const productId = await createTestProduct();
    await expect(
      ReviewService.add({
        product_id: productId,
        user_id: testUser1,
        rate: 0 as any,
        comment: "No rate",
      }),
    ).rejects.toThrow("no review is recieved");
  });

  it("should throw when adding review with invalid product_id", async () => {
    await expect(
      ReviewService.add({
        product_id: "invalid-product-id",
        user_id: testUser1,
        rate: 3,
        comment: "Bad product id",
      }),
    ).rejects.toThrow("product id is invalid");
  });

  it("should throw when adding review with invalid user_id", async () => {
    const productId = await createTestProduct();
    await expect(
      ReviewService.add({
        product_id: productId,
        user_id: "invalid-user-id",
        rate: 3,
        comment: "Bad user id",
      }),
    ).rejects.toThrow("user id is invalid");
  });

  it("should throw when finding product reviews with invalid ObjectId", async () => {
    await expect(
      ReviewService.findProductReviews("invalid-id"),
    ).rejects.toThrow("review id is invalid");
  });

  it("should return empty array when finding reviews for product with no reviews", async () => {
    const productId = await createTestProduct();
    const reviews = await ReviewService.findProductReviews(productId);
    expect(reviews).toBeDefined();
    expect(Array.isArray(reviews)).toBe(true);
    expect(reviews).toHaveLength(0);
  });

  it("should throw when deleting review with invalid ObjectId", async () => {
    await expect(ReviewService.delete("invalid-id", testUser1)).rejects.toThrow(
      "review id is invalid",
    );
  });
});
