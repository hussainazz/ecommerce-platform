import type { any } from "zod/v3";
import { database } from "../database.ts";
import type { Collection, MongoClient } from "mongodb";

export let orderCollection: Collection;
const collections = await database.listCollections({ name: "Order" }).toArray();
if (collections.length === 1) {
  orderCollection = database.collection("Order");
} else {
  orderCollection = await database.createCollection("Order", {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        title: "Order Validation",
        required: ["user_id", "items", "totalPrice", "status"],
        properties: {
          user_id: {
            bsonType: "objectId",
            description: "Reference to the User who placed the order",
          },
          products: {
            bsonType: "array",
            description: "List of products and quantities",
            minItems: 1,
            items: {
              bsonType: "object",
              required: ["product_id", "count"],
              properties: {
                product_id: {
                  bsonType: "string",
                  description: "Reference to the Product",
                },
                count: {
                  bsonType: "int",
                  minimum: 1,
                  description: "Quantity must be at least 1",
                },
              },
            },
          },
          totalPrice: {
            bsonType: "long",
            minimum: 0,
            description: "Total cost of the order",
          },
          shipping_address: {
            bsonType: "object",
            description: "Optional shipping details",
            required: ["street", "city", "province", "postCode"],
            properties: {
              street: { bsonType: "string" },
              city: { bsonType: "string" },
              province: { bsonType: "string" },
              postCode: { bsonType: "int", length: 10 },
            },
          },
          status: {
            bsonType: "string",
            enum: ["completed", "confirmed", "pending", "canceled"],
            default: "pending",
            description: "Current status of the order",
          },
          created_at: { bsonType: "number" },
          confirmed_at: { bsonType: "number" },
          completed_at: { bsonType: "number" },
          canceled_at: { bsonType: "number" },
        },
      },
      // ensure postcode is 10-digits
      $expr: {
        $and: [
          { $gte: ["$postCode", 1000000000] },
          { $lt: ["$postCode", 10000000000] },
        ],
      },
      validationLevel: "strict",
      validationAction: "error",
    },
  });
}
