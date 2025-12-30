import { productCollection } from "@db/schemas/product.schema.ts";
import { reviewCollection } from "@db/schemas/review.schema.ts";
import * as Types from "@shared/types/types.ts";
import { obj } from "find-config";
import { ObjectId } from "mongodb";
import { openAsBlob } from "node:fs";

export class ReviewService {
  static async add(
    data: Omit<Types.Review, "_id" | "created_at">,
  ): Promise<Types.Review> {
    const { rate, comment, product_id, user_id } = data;
    if (!rate) throw new Error("no review is recieved");
    if (!ObjectId.isValid(product_id)) throw new Error(`product id is invalid`);
    if (!ObjectId.isValid(user_id)) throw new Error(`user id is invalid`);
    // check prod exist
    const foundProd = await productCollection.findOne({
      _id: new ObjectId(product_id),
    });
    if (!foundProd) throw new Error("product no longer exist");
    // check prod is not soldOut
    if (foundProd.stock === 0) throw new Error("product is sold out");

    let addedReview;
    const created_at = new Date();
    try {
      addedReview = await reviewCollection.insertOne({
        product_id: new ObjectId(product_id),
        user_id: new ObjectId(user_id),
        rate: rate,
        comment: comment || null,
        created_at,
      });
    } catch (err: any) {
      if (err.code === 11000)
        throw new Error("one user can't add multiple reviews for one product");
    }
    if (!addedReview.insertedId) throw new Error("review not inserted");
    return {
      _id: addedReview.insertedId.toString(),
      product_id,
      user_id,
      rate: rate,
      comment: comment,
      created_at,
    };
  }

  static async findProductReviews(
    productId: string,
  ): Promise<Types.Review[] | null> {
    if (!ObjectId.isValid(productId)) throw new Error(`review id is invalid`);
    const result: Types.Review[] | null = await reviewCollection.find({
      productId: new ObjectId(productId),
    });
    return result;
  }

  static async findById(_id: string) {
    if (!ObjectId.isValid(_id)) throw new Error(`review id is invalid`);
    const result = await reviewCollection.findOne({ _id: new ObjectId(_id) });
    if (!result) {
      throw new Error(`review ${_id} not exist`);
    }
    return result;
  }

  static async delete(_id: string, user_id: string) {
    if (!ObjectId.isValid(_id)) throw new Error(`review id is invalid`);
    if (!ObjectId.isValid(user_id)) throw new Error(`user id is invalid`);
    const result = await reviewCollection.deleteOne({
      _id: new ObjectId(_id),
      user_id: new ObjectId(user_id),
    });
    if (result.deletedCount === 0) throw new Error("review no longer exist");
    return result;
  }
}
