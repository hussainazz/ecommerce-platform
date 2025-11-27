import { database } from "../database.ts";

export let productCollection: any;

const collections = await database
  .listCollections({ name: "Product" })
  .toArray();
if (collections.length === 1) {
  productCollection = database.collection("Product");
} else {
  productCollection = await database.createCollection("Product", {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        title: "Product Validation",
        required: ["title", "price", "stock", "category"],
        properties: {
          title: {
            bsonType: "string",
            description: "Product title must be a string and is required",
          },
          price: {
            bsonType: "long",
            minimum: 0,
            description: "Price must be a positive number and is required",
          },
          stock: {
            bsonType: "int",
            minimum: 0,
            description:
              "stock count must be a non-negative integer and is required",
          },
          category: {
            bsonType: "string",
            description: "Category must be a string and is required",
          },
          description: {
            bsonType: "string",
            description: "Optional detailed product description",
          },
        },
      },
      validationLevel: "strict",
      validationAction: "error",
    },
  });
}
