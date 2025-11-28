import { database } from "@db/database.ts";

export let reviewCollection: any;
const collections = await database
  .listCollections({ name: "Review" })
  .toArray();
if (collections.length === 1) {
  reviewCollection = database.collection("Review");
} else {
  reviewCollection = await database.createCollection("Review", {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["product_id", "user_id", "rate"],
        properties: {
          product_id: {
            bsonType: "objectId",
            description: "product_id type most be obejctId and is required",
          },
          user_id: {
            bsonType: "objectId",
            description: "user_id type most be objectId and is required",
          },
          rate: {
            bsonType: "int",
            minimum: 1,
            maximum: 5,
            description: "rate from 1 to 5",
          },
          comment: {
            bsonType: ["string", "null"],
            description: "comment must be type of string",
          },
          created_at: {
            bsonType: "date",
            description: "when the review was created",
          },
        },
      },
    },
  });
}

await reviewCollection.createIndex(
  { product_id: 1, user_id: 1 },
  { unique: true },
);
