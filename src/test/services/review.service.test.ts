import { productCollection } from "@db/schemas/product.schema.ts";
import { reviewCollection } from "@db/schemas/review.schema.ts";
import { ReviewService } from "@features/reviews/review.service.ts";
import { Long, ObjectId } from "mongodb";

let test_reviewID: ObjectId | undefined;
let test_productID: string;
let test_userID1 = "64bfa4d2e3c2a1f8b4d6c9e2";
let test_userID2 = "507f1f77bcf86cd799439013";
let test_nonExistProdID = "507f1f77bcf86cd799439015";
let test_noStockProdID: string;
const [newReview1, newReview2] = [
  {
    rate: 2 as 2,
    comment: "test text",
  },
  {
    rate: 4 as 4,
    comment: "test second text",
  },
];

beforeAll(async () => {
  await reviewCollection.deleteMany({});
  const prodForTest = await productCollection.insertOne({
    title: "Test",
    price: new Long(100),
    category: "test",
    stock: 10,
  });
  test_productID = prodForTest.insertedId.toString();
  const testReview = await reviewCollection.insertOne({
    product_id: new ObjectId(test_productID),
    user_id: new ObjectId("507f1f77bcf86cd799439011"),
    rate: 4,
    comment: "test comment",
  });
  const soldOutProd = await productCollection.insertOne({
    title: "tst",
    price: new Long(300),
    category: "tst",
    stock: 0,
  });
  test_noStockProdID = soldOutProd.insertedId.toString();
});

afterAll(async () => {
  await reviewCollection.deleteMany({});
});

describe("ReviewService - integratoinTest", () => {
  it("should add reviews", async () => {
    const instertedReview = await ReviewService.add(
      test_productID,
      test_userID1,
      newReview1,
    );
    const addedReview = await reviewCollection.findOne({
      product_id: new ObjectId(test_productID),
      user_id: new ObjectId(test_userID1),
    });
    expect(addedReview?._id.toString()).toEqual(instertedReview._id);
  });
  it("should throw when one user adds multiple reviews", async () => {
    await reviewCollection.deleteMany({});
    await ReviewService.add(test_productID, test_userID1, newReview1);
    await expect(
      ReviewService.add(test_productID.toString(), test_userID1, newReview2),
    ).rejects.toThrow("one user can't add multiple reviews for one product");
  });
  it("should throw when review adding for non-existent product", async () => {
    await expect(
      ReviewService.add(test_nonExistProdID, test_userID1, newReview1),
    ).rejects.toThrow("product no longer exist");
  });
  it("should throw adding review for sold out product", async () => {
    await expect(
      ReviewService.add(test_noStockProdID, test_userID1, newReview1),
    ).rejects.toThrow("product is sold out");
  });
  it("should throw when delete non-existing review", async () => {
    await expect(
      ReviewService.delete("507f1f77bcf86cd799439011"),
    ).rejects.toThrow("review no longer exist");
  });
});
