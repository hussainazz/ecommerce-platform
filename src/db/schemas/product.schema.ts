import { database } from "../database.ts";

export let productCollection = database.collection("Product");
if (!productCollection) {
  productCollection = await database.createCollection("Product", {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        title: "Product Validation",
        required: ["title", "price", "inventory", "category"],
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
          inventory: {
            bsonType: "int",
            minimum: 0,
            description:
              "Inventory count must be a non-negative integer and is required",
          },
          category: {
            bsonType: "string",
            description: "Category must be a string and is required",
          },
          description: {
            bsonType: "string",
            description: "Optional detailed product description",
          },
          reviews: {
            bsonType: "array",
            items: {
              bsonType: "object",
              required: ["user_id", "rate"],
              properties: {
                user_id: {
                  bsonType: "objectId",
                  description: "user_id most an objectId and is required",
                },
                rate: {
                  bsonType: "int",
                  minimum: 1,
                  maximum: 5,
                  description: "rate from 1 to 5",
                },
                text: {
                  bsonType: ["string", "null"],
                  description: "text must be type of string",
                },
                created_at: {
                  bsonType: "number",
                  description: "when the review was created",
                },
              },
            },
          },
        },
      },
      validationLevel: "strict",
      validationAction: "error",
    },
  });
}
