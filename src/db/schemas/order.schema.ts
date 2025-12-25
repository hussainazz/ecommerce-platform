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
        required: ["user_id", "products", "totalPrice", "status"],
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
                  bsonType: "objectId",
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
            bsonType: "number",
            minimum: 0,
            description: "Total cost of the order",
          },
          shipping_address: {
            bsonType: "object",
            required: ["street", "city", "province", "postCode"],
            properties: {
              street: { bsonType: "string" },
              city: { bsonType: "string" },
              province: { bsonType: "string" },
              postCode: { bsonType: "number" },
            },
          },
          status: {
            bsonType: "string",
            enum: ["completed", "confirmed", "pending", "canceled"],
            description: "Current status of the order",
          },
          created_at: { bsonType: "date" },
          updated_at: { bsonType: "date" },
          confirmed_at: { bsonType: "date" },
          completed_at: { bsonType: "date" },
          canceled_at: { bsonType: "date" },
        },
      },
      // ensure postcode is 10-digits
      $expr: {
        $and: [
          { $gte: ["$shipping_address.postCode", 1000000000] },
          { $lt: ["$shipping_address.postCode", 10000000000] },
        ],
      },
    },
    validationLevel: "strict",
    validationAction: "error",
  });
}
